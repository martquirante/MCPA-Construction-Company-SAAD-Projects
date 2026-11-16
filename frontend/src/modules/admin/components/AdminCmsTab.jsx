"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authFetch } from "@/modules/shared/authFetch";
import {
  useCms,
  DEFAULT_CMS_THEME,
  CURATED_WEB_FONTS,
  notifyCmsUpdate,
} from "@/modules/cms/CmsContext";
import {
  SocialLinksInputManager,
  SocialCrossPostBadges,
} from "@/modules/blog/SocialCrossPostBadges";
import {
  Plus,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Film,
  Hash,
  Folder,
  Globe,
  Palette,
  FileText,
  Sparkles,
  Search,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Heading1,
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  RotateCcw,
  Save,
  Monitor,
  Tablet,
  Smartphone,
  LayoutGrid,
  Newspaper,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";

const PAGE_SECTIONS_SCHEMA = [
  {
    pageKey: "home",
    label: "Home Page",
    description: "Hero banner, core value proposition pillars, engineering statistics, and craft videos.",
    sections: [
      {
        sectionKey: "hero",
        title: "Hero Banner & Primary Call-to-Action",
        fields: [
          { key: "heroBadge", label: "Hero Eyebrow Badge", type: "text" },
          { key: "heroHeading", label: "Hero Main Heading", type: "text" },
          { key: "heroSubPre", label: "Subtitle Prefix", type: "text" },
          { key: "heroSubBold", label: "Subtitle Highlighted Brand Name", type: "text" },
          { key: "heroSubPost", label: "Subtitle Suffix", type: "text" },
          { key: "bookAppointment", label: "Primary CTA Button Label", type: "text" },
          { key: "heroBackgroundMedia", label: "Hero Background Photo / Video (File Upload or URL)", type: "media" },
        ],
      },
      {
        sectionKey: "overview",
        title: "Why Homeowners Build With MCPA (3 Pillars)",
        fields: [
          { key: "overviewEyebrow", label: "Section Eyebrow", type: "text" },
          { key: "overviewHeading", label: "Section Main Heading", type: "text" },
          { key: "overviewDescription", label: "Section Description", type: "textarea" },
          { key: "pillarStrengthTitle", label: "Pillar 1 Title (Strength)", type: "text" },
          { key: "pillarStrengthDescription", label: "Pillar 1 Description", type: "textarea" },
          { key: "pillarUpdatesTitle", label: "Pillar 2 Title (Updates)", type: "text" },
          { key: "pillarUpdatesDescription", label: "Pillar 2 Description", type: "textarea" },
          { key: "pillarPaymentTitle", label: "Pillar 3 Title (Build Now Pay Later)", type: "text" },
          { key: "pillarPaymentDescription", label: "Pillar 3 Description", type: "textarea" },
        ],
      },
      {
        sectionKey: "stats",
        title: "Key Engineering & Licensing Statistics",
        fields: [
          { key: "stat1_title", label: "Stat 1 Heading / Title", type: "text" },
          { key: "stat1_value", label: "Stat 1 Value", type: "text" },
          { key: "stat1_label", label: "Stat 1 Label", type: "text" },
          { key: "stat1_desc", label: "Stat 1 Subtitle / Description", type: "textarea" },

          { key: "stat2_title", label: "Stat 2 Heading / Title", type: "text" },
          { key: "stat2_value", label: "Stat 2 Value", type: "text" },
          { key: "stat2_label", label: "Stat 2 Label", type: "text" },
          { key: "stat2_desc", label: "Stat 2 Subtitle / Description", type: "textarea" },

          { key: "stat3_title", label: "Stat 3 Heading / Title", type: "text" },
          { key: "stat3_value", label: "Stat 3 Value (PCAB)", type: "text" },
          { key: "stat3_label", label: "Stat 3 Label", type: "text" },
          { key: "stat3_desc", label: "Stat 3 Subtitle / Description", type: "textarea" },

          { key: "stat4_title", label: "Stat 4 Heading / Title", type: "text" },
          { key: "stat4_value", label: "Stat 4 Value", type: "text" },
          { key: "stat4_label", label: "Stat 4 Label", type: "text" },
          { key: "stat4_desc", label: "Stat 4 Subtitle / Description", type: "textarea" },
        ],
      },
      {
        sectionKey: "craft_motion",
        title: "Our Craft in Motion (6 Video Timelapses & Walkthroughs)",
        fields: [
          { key: "craftMotionEyebrow", label: "Section Eyebrow", type: "text" },
          { key: "craftMotionHeading", label: "Section Main Heading", type: "text" },
          { key: "craftMotionDesc", label: "Section Subtitle / Description", type: "textarea" },

          { key: "video1_title", label: "Video 1 Title (e.g. Modern Tropical Bungalow)", type: "text" },
          { key: "video1_phase", label: "Video 1 Phase / Subtitle", type: "text" },
          { key: "video1_src", label: "Video 1 MP4 Video File / URL", type: "media" },
          { key: "video1_poster", label: "Video 1 Cover / Poster Image", type: "media" },

          { key: "video2_title", label: "Video 2 Title (e.g. 2-Storey Luxury Residence)", type: "text" },
          { key: "video2_phase", label: "Video 2 Phase / Subtitle", type: "text" },
          { key: "video2_src", label: "Video 2 MP4 Video File / URL", type: "media" },
          { key: "video2_poster", label: "Video 2 Cover / Poster Image", type: "media" },

          { key: "video3_title", label: "Video 3 Title (e.g. Single-Storey Modern Estate)", type: "text" },
          { key: "video3_phase", label: "Video 3 Phase / Subtitle", type: "text" },
          { key: "video3_src", label: "Video 3 MP4 Video File / URL", type: "media" },
          { key: "video3_poster", label: "Video 3 Cover / Poster Image", type: "media" },

          { key: "video4_title", label: "Video 4 Title (e.g. Flickertech Commercial)", type: "text" },
          { key: "video4_phase", label: "Video 4 Phase / Subtitle", type: "text" },
          { key: "video4_src", label: "Video 4 MP4 Video File / URL", type: "media" },
          { key: "video4_poster", label: "Video 4 Cover / Poster Image", type: "media" },

          { key: "video5_title", label: "Video 5 Title (e.g. Tropical Open-Concept Living)", type: "text" },
          { key: "video5_phase", label: "Video 5 Phase / Subtitle", type: "text" },
          { key: "video5_src", label: "Video 5 MP4 Video File / URL", type: "media" },
          { key: "video5_poster", label: "Video 5 Cover / Poster Image", type: "media" },

          { key: "video6_title", label: "Video 6 Title (e.g. Courtyard Villa & Grand Suite)", type: "text" },
          { key: "video6_phase", label: "Video 6 Phase / Subtitle", type: "text" },
          { key: "video6_src", label: "Video 6 MP4 Video File / URL", type: "media" },
          { key: "video6_poster", label: "Video 6 Cover / Poster Image", type: "media" },
        ],
      },
      {
        sectionKey: "cta",
        title: "Bottom Call-to-Action Banner",
        fields: [
          { key: "ctaHeading", label: "CTA Heading", type: "text" },
          { key: "ctaSubtitle", label: "CTA Subtitle / Description", type: "textarea" },
          { key: "ctaButtonLabel", label: "CTA Button Label", type: "text" },
        ],
      },
    ],
  },
  {
    pageKey: "services",
    label: "Services Page",
    description: "Header, 4 resilience metrics, 6 full services with deliverables, and Home service cards.",
    sections: [
      {
        sectionKey: "hero",
        title: "Services Masthead & Headline",
        fields: [
          { key: "servicesHeroEyebrow", label: "Services Page Eyebrow", type: "text" },
          { key: "servicesHeroTitle", label: "Main Heading Prefix", type: "text" },
          { key: "servicesHeroTitleAccent", label: "Main Heading Highlight (Accent)", type: "text" },
          { key: "servicesHeroDesc", label: "Services Page Description", type: "textarea" },
          { key: "servicesHeroMedia", label: "Services Hero Header Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "metrics",
        title: "Quick Resilience Metrics (4 Top Stat Cards)",
        fields: [
          { key: "metric1_title", label: "Metric 1 Title", type: "text" },
          { key: "metric1_highlight", label: "Metric 1 Highlight Tag (e.g. Ready)", type: "text" },
          { key: "metric1_label", label: "Metric 1 Subtitle Label", type: "text" },

          { key: "metric2_title", label: "Metric 2 Title", type: "text" },
          { key: "metric2_highlight", label: "Metric 2 Highlight Tag (e.g. Supply)", type: "text" },
          { key: "metric2_label", label: "Metric 2 Subtitle Label", type: "text" },

          { key: "metric3_title", label: "Metric 3 Title", type: "text" },
          { key: "metric3_highlight", label: "Metric 3 Highlight Tag (e.g. %)", type: "text" },
          { key: "metric3_label", label: "Metric 3 Subtitle Label", type: "text" },

          { key: "metric4_title", label: "Metric 4 Title", type: "text" },
          { key: "metric4_highlight", label: "Metric 4 Highlight Tag (e.g. Program)", type: "text" },
          { key: "metric4_label", label: "Metric 4 Subtitle Label", type: "text" },
        ],
      },
      {
        sectionKey: "all_services",
        title: "6 Full Detailed Services (Services Page Grid)",
        fields: [
          // Service 1
          { key: "service1_badge", label: "Service 1 Badge (e.g. Complete Turnkey Build)", type: "text" },
          { key: "service1_title", label: "Service 1 Main Title", type: "text" },
          { key: "service1_subtitle", label: "Service 1 Subtitle", type: "text" },
          { key: "service1_desc", label: "Service 1 Full Description", type: "textarea" },
          { key: "service1_inclusions", label: "Service 1 Deliverables (One deliverable per line)", type: "textarea" },
          { key: "service1_cta", label: "Service 1 Button Label", type: "text" },
          { key: "service1_media", label: "Service 1 Showcase Photo / Video", type: "media" },

          // Service 2
          { key: "service2_badge", label: "Service 2 Badge (e.g. Flexible Payment Options)", type: "text" },
          { key: "service2_title", label: "Service 2 Main Title", type: "text" },
          { key: "service2_subtitle", label: "Service 2 Subtitle", type: "text" },
          { key: "service2_desc", label: "Service 2 Full Description", type: "textarea" },
          { key: "service2_inclusions", label: "Service 2 Deliverables (One deliverable per line)", type: "textarea" },
          { key: "service2_cta", label: "Service 2 Button Label", type: "text" },
          { key: "service2_media", label: "Service 2 Showcase Photo / Video", type: "media" },

          // Service 3
          { key: "service3_badge", label: "Service 3 Badge (e.g. Licensed Architects & Engineers)", type: "text" },
          { key: "service3_title", label: "Service 3 Main Title", type: "text" },
          { key: "service3_subtitle", label: "Service 3 Subtitle", type: "text" },
          { key: "service3_desc", label: "Service 3 Full Description", type: "textarea" },
          { key: "service3_inclusions", label: "Service 3 Deliverables (One deliverable per line)", type: "textarea" },
          { key: "service3_cta", label: "Service 3 Button Label", type: "text" },
          { key: "service3_media", label: "Service 3 Showcase Photo / Video", type: "media" },

          // Service 4
          { key: "service4_badge", label: "Service 4 Badge (e.g. Commercial & Warehouses)", type: "text" },
          { key: "service4_title", label: "Service 4 Main Title", type: "text" },
          { key: "service4_subtitle", label: "Service 4 Subtitle", type: "text" },
          { key: "service4_desc", label: "Service 4 Full Description", type: "textarea" },
          { key: "service4_inclusions", label: "Service 4 Deliverables (One deliverable per line)", type: "textarea" },
          { key: "service4_cta", label: "Service 4 Button Label", type: "text" },
          { key: "service4_media", label: "Service 4 Showcase Photo / Video", type: "media" },

          // Service 5
          { key: "service5_badge", label: "Service 5 Badge (e.g. In-House Materials & Supply)", type: "text" },
          { key: "service5_title", label: "Service 5 Main Title", type: "text" },
          { key: "service5_subtitle", label: "Service 5 Subtitle", type: "text" },
          { key: "service5_desc", label: "Service 5 Full Description", type: "textarea" },
          { key: "service5_inclusions", label: "Service 5 Deliverables (One deliverable per line)", type: "textarea" },
          { key: "service5_cta", label: "Service 5 Button Label", type: "text" },
          { key: "service5_media", label: "Service 5 Showcase Photo / Video", type: "media" },

          // Service 6
          { key: "service6_badge", label: "Service 6 Badge (e.g. Home Renovations & Upgrades)", type: "text" },
          { key: "service6_title", label: "Service 6 Main Title", type: "text" },
          { key: "service6_subtitle", label: "Service 6 Subtitle", type: "text" },
          { key: "service6_desc", label: "Service 6 Full Description", type: "textarea" },
          { key: "service6_inclusions", label: "Service 6 Deliverables (One deliverable per line)", type: "textarea" },
          { key: "service6_cta", label: "Service 6 Button Label", type: "text" },
          { key: "service6_media", label: "Service 6 Showcase Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "highlights",
        title: "Home Page Services Section (4 Quick Cards)",
        fields: [
          { key: "whatWeDo", label: "Section Eyebrow", type: "text" },
          { key: "servicesThat", label: "Heading Part 1", type: "text" },
          { key: "defineEras", label: "Heading Part 2 (Accent)", type: "text" },
          { key: "servicesSubtitle", label: "Services Subtitle", type: "textarea" },
          { key: "serviceTurnkeyTag", label: "Card 1 Tag", type: "text" },
          { key: "serviceTurnkeyTitle", label: "Card 1 Title", type: "text" },
          { key: "serviceTurnkeyDesc", label: "Card 1 Description", type: "textarea" },
          { key: "serviceBnplTag", label: "Card 2 Tag", type: "text" },
          { key: "serviceBnplTitle", label: "Card 2 Title", type: "text" },
          { key: "serviceBnplDesc", label: "Card 2 Description", type: "textarea" },
          { key: "servicePlansTag", label: "Card 3 Tag", type: "text" },
          { key: "servicePlansTitle", label: "Card 3 Title", type: "text" },
          { key: "servicePlansDesc", label: "Card 3 Description", type: "textarea" },
          { key: "serviceSupplyTag", label: "Card 4 Tag", type: "text" },
          { key: "serviceSupplyTitle", label: "Card 4 Title", type: "text" },
          { key: "serviceSupplyDesc", label: "Card 4 Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    pageKey: "projects",
    label: "Projects / Selected Works",
    description: "Headings and introductory copy for the architectural portfolio.",
    sections: [
      {
        sectionKey: "header",
        title: "Portfolio Masthead",
        fields: [
          { key: "projectsEyebrow", label: "Portfolio Eyebrow", type: "text" },
          { key: "projectsHeading", label: "Portfolio Heading", type: "text" },
          { key: "projectsDescription", label: "Portfolio Description", type: "textarea" },
        ],
      },
      {
        sectionKey: "structural",
        title: "MCPA Structural Standard & Materials Specification",
        fields: [
          {
            key: "defaultStructuralStandard",
            label: "Global Default Structural Standard & Materials Text",
            type: "textarea",
          },
          {
            key: "structuralMaterialsList",
            label: "Key Materials Names (e.g. Rebars, 3000+ PSI Ready-Mix Concrete, NSCP Earthquake Compliance)",
            type: "text",
          },
        ],
      },
    ],
  },
  {
    pageKey: "process",
    label: "Our Process",
    description: "4-stage construction workflow from site consultation to key turnover, plus quality guarantees.",
    sections: [
      {
        sectionKey: "steps",
        title: "Process Masthead & Hero",
        fields: [
          { key: "processEyebrow", label: "Process Eyebrow", type: "text" },
          { key: "processHeading", label: "Process Main Heading", type: "text" },
          { key: "processDescription", label: "Process Overview Description", type: "textarea" },
          { key: "processHeroMedia", label: "Process Hero Banner Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "stage1",
        title: "Stage 1: Custom Design & Blueprints Purchase",
        fields: [
          { key: "step1_badge", label: "Stage 1 Eyebrow Badge", type: "text" },
          { key: "step1_title", label: "Stage 1 Main Title", type: "text" },
          { key: "step1_subtitle", label: "Stage 1 Subtitle", type: "text" },
          { key: "step1_desc", label: "Stage 1 Full Description", type: "textarea" },
          { key: "step1_telemetry", label: "Stage 1 Highlight Chips (e.g. Signed & Sealed Plans · 3D Renders)", type: "text" },
          { key: "step1_checklist", label: "Stage 1 Key Milestones (One per line)", type: "textarea" },
          { key: "step1_output", label: "Stage 1 Output Deliverable", type: "text" },
          { key: "step1_media", label: "Stage 1 Illustration Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "stage2",
        title: "Stage 2: Build Now, Pay Later (BNPL) Financing Application",
        fields: [
          { key: "step2_badge", label: "Stage 2 Eyebrow Badge", type: "text" },
          { key: "step2_title", label: "Stage 2 Main Title", type: "text" },
          { key: "step2_subtitle", label: "Stage 2 Subtitle", type: "text" },
          { key: "step2_desc", label: "Stage 2 Full Description", type: "textarea" },
          { key: "step2_telemetry", label: "Stage 2 Highlight Chips (e.g. Zero Downpayment · Fast Loan Approval)", type: "text" },
          { key: "step2_checklist", label: "Stage 2 Key Milestones (One per line)", type: "textarea" },
          { key: "step2_output", label: "Stage 2 Output Deliverable", type: "text" },
          { key: "step2_media", label: "Stage 2 Illustration Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "stage3",
        title: "Stage 3: Construction Push-Through & Foundation",
        fields: [
          { key: "step3_badge", label: "Stage 3 Eyebrow Badge", type: "text" },
          { key: "step3_title", label: "Stage 3 Main Title", type: "text" },
          { key: "step3_subtitle", label: "Stage 3 Subtitle", type: "text" },
          { key: "step3_desc", label: "Stage 3 Full Description", type: "textarea" },
          { key: "step3_telemetry", label: "Stage 3 Highlight Chips (e.g. Rebars · 3000 PSI Concrete · Weekly Logs)", type: "text" },
          { key: "step3_checklist", label: "Stage 3 Key Milestones (One per line)", type: "textarea" },
          { key: "step3_output", label: "Stage 3 Output Deliverable", type: "text" },
          { key: "step3_media", label: "Stage 3 Illustration Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "stage4",
        title: "Stage 4: Final Quality Inspection & House Turnover",
        fields: [
          { key: "step4_badge", label: "Stage 4 Eyebrow Badge", type: "text" },
          { key: "step4_title", label: "Stage 4 Main Title", type: "text" },
          { key: "step4_subtitle", label: "Stage 4 Subtitle", type: "text" },
          { key: "step4_desc", label: "Stage 4 Full Description", type: "textarea" },
          { key: "step4_telemetry", label: "Stage 4 Highlight Chips (e.g. Walkthrough · Occupancy · 15-Yr Warranty)", type: "text" },
          { key: "step4_checklist", label: "Stage 4 Key Milestones (One per line)", type: "textarea" },
          { key: "step4_output", label: "Stage 4 Output Deliverable", type: "text" },
          { key: "step4_media", label: "Stage 4 Illustration Photo / Video", type: "media" },
        ],
      },
      {
        sectionKey: "pillars",
        title: "Process Guarantees (4 Quality Pillars)",
        fields: [
          { key: "pillar1_title", label: "Guarantee 1 Title", type: "text" },
          { key: "pillar1_desc", label: "Guarantee 1 Description", type: "textarea" },
          { key: "pillar2_title", label: "Guarantee 2 Title", type: "text" },
          { key: "pillar2_desc", label: "Guarantee 2 Description", type: "textarea" },
          { key: "pillar3_title", label: "Guarantee 3 Title", type: "text" },
          { key: "pillar3_desc", label: "Guarantee 3 Description", type: "textarea" },
          { key: "pillar4_title", label: "Guarantee 4 Title", type: "text" },
          { key: "pillar4_desc", label: "Guarantee 4 Description", type: "textarea" },
        ],
      },
    ],
  },
  {
    pageKey: "about",
    label: "About & Company Info",
    description: "Company introduction, mission, vision, and 15-year structural warranty.",
    sections: [
      {
        sectionKey: "company",
        title: "Corporate Identity & Warranty",
        fields: [
          { key: "aboutTitle", label: "About Heading", type: "text" },
          { key: "aboutSub", label: "About Subtitle", type: "text" },
          { key: "aboutBio", label: "Company Biography", type: "textarea" },
          { key: "mission", label: "Corporate Mission", type: "textarea" },
          { key: "vision", label: "Corporate Vision", type: "textarea" },
          { key: "warrantyTitle", label: "Warranty Title", type: "text" },
          { key: "warrantyDesc", label: "Warranty Description", type: "textarea" },
          { key: "aboutFeatureMedia", label: "Company Showcase Photo / Video (File Upload)", type: "media" },
        ],
      },
    ],
  },
  {
    pageKey: "contact",
    label: "Contact & Inquiry Info",
    description: "Headquarters address, phone numbers, official emails, hours, and social links.",
    sections: [
      {
        sectionKey: "info",
        title: "Headquarters & Official Channels",
        fields: [
          { key: "address", label: "Office Address", type: "text" },
          { key: "hotline", label: "Direct Mobile / Viber Hotline", type: "text" },
          { key: "email", label: "Primary Official Email", type: "text" },
          { key: "alt_email", label: "Secondary Email", type: "text" },
          { key: "office_hours", label: "Business Operating Hours", type: "text" },
          { key: "facebook_url", label: "Facebook Page URL", type: "text" },
          { key: "instagram_url", label: "Instagram Profile URL", type: "text" },
          { key: "tiktok_url", label: "TikTok Profile URL", type: "text" },
        ],
      },
    ],
  },
  {
    pageKey: "footer",
    label: "Footer & Global Navigation",
    description: "Navigation labels, rotating announcement bar messages, and footer text.",
    sections: [
      {
        sectionKey: "general",
        title: "Footer Brand Summary & Copyright",
        fields: [
          { key: "tagline", label: "Footer Company Description", type: "textarea" },
          { key: "copyright", label: "Copyright Notice", type: "text" },
        ],
      },
    ],
  },
  {
    pageKey: "global",
    label: "Global Navigation & Top Bar",
    description: "Navbar menu labels and utility bar rotating announcements.",
    sections: [
      {
        sectionKey: "navigation",
        title: "Header Navigation Menu Labels",
        fields: [
          { key: "navHome", label: "Home Link Label", type: "text" },
          { key: "navProjects", label: "Projects Link Label", type: "text" },
          { key: "navServices", label: "Services Link Label", type: "text" },
          { key: "navProcess", label: "Process Link Label", type: "text" },
          { key: "navBlog", label: "Blog & Updates Link Label", type: "text" },
          { key: "clientPortal", label: "Client Portal Button Label", type: "text" },
        ],
      },
      {
        sectionKey: "announcements",
        title: "Top Utility Bar Rotating Announcements",
        fields: [
          { key: "announcement_1", label: "Announcement Slide 1", type: "text" },
          { key: "announcement_2", label: "Announcement Slide 2", type: "text" },
          { key: "announcement_3", label: "Announcement Slide 3", type: "text" },
          { key: "announcement_4", label: "Announcement Slide 4", type: "text" },
        ],
      },
    ],
  },
];

const THEME_PRESETS = [
  {
    name: "MCPA Signature Amber",
    primaryColor: "#f59e0b",
    secondaryColor: "#5b6770",
    accentColor: "#d97706",
    surfaceLight: "#f8f7f5",
    surfaceDark: "#080a0e",
  },
  {
    name: "Architectural Bronze",
    primaryColor: "#d97706",
    secondaryColor: "#57534e",
    accentColor: "#b45309",
    surfaceLight: "#faf8f5",
    surfaceDark: "#0c0a09",
  },
  {
    name: "Structural Steel Blue",
    primaryColor: "#0ea5e9",
    secondaryColor: "#475569",
    accentColor: "#0284c7",
    surfaceLight: "#f8fafc",
    surfaceDark: "#090d16",
  },
  {
    name: "Emerald Engineering",
    primaryColor: "#10b981",
    secondaryColor: "#52525b",
    accentColor: "#059669",
    surfaceLight: "#f7fee7",
    surfaceDark: "#070e0b",
  },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AdminCmsTab({ initialSection = "blog", showToast }) {
  const { refreshCms, previewTheme, theme: activeGlobalTheme } = useCms();

  const [activeSubTab, setActiveSubTab] = useState(initialSection);
  const [prevInitialSection, setPrevInitialSection] = useState(initialSection);
  if (initialSection !== prevInitialSection) {
    setPrevInitialSection(initialSection);
    setActiveSubTab(initialSection);
  }

  // Overview & Logs state
  const [overview, setOverview] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);

  // Blog & Posts state
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postFilterStatus, setPostFilterStatus] = useState("all");
  const [postFilterCategory, setPostFilterCategory] = useState("all");
  const [postSearch, setPostSearch] = useState("");

  // Post Composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postForm, setPostForm] = useState({
    title: "",
    caption: "",
    content: "",
    post_type: "project_update",
    category_id: "",
    author_name: "MCPA Construction and Supply",
    author_role: "MCPA Construction & Supply",
    status: "published",
    scheduled_for: "",
    media: [],
    hashtags: [],
    link_preview: null,
    social_links: [],
  });
  const [hashtagInput, setHashtagInput] = useState("");
  const [linkInputUrl, setLinkInputUrl] = useState("");
  const [fetchingLinkPreview, setFetchingLinkPreview] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDraggingOverComposer, setIsDraggingOverComposer] = useState(false);
  const [selectedLibraryUrls, setSelectedLibraryUrls] = useState([]);
  const [savingPost, setSavingPost] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null);

  // Rich Text Editor ref
  const editorRef = useRef(null);

  // Media Library state
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaFilterType, setMediaFilterType] = useState("all");
  const [mediaSearch, setMediaSearch] = useState("");
  const [mediaPickerModalOpen, setMediaPickerModalOpen] = useState(false);
  const [mediaDeleteWarning, setMediaDeleteWarning] = useState(null);
  const [cmsMediaPickerTarget, setCmsMediaPickerTarget] = useState(null); // { pageKey, sectionKey, contentKey }
  const [addingFieldToSection, setAddingFieldToSection] = useState(null); // { pageKey, sectionKey }
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  // Website-Wide Content state
  const [activePageKey, setActivePageKey] = useState("home");
  const [editableContentMap, setEditableContentMap] = useState({});
  const [savingContent, setSavingContent] = useState(false);

  // Theme & Appearance state
  const [draftTheme, setDraftTheme] = useState(DEFAULT_CMS_THEME);
  const [previewViewport, setPreviewViewport] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [savingTheme, setSavingTheme] = useState(false);

  // New Category / Hashtag state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [newHashtagText, setNewHashtagText] = useState("");

  const notify = useCallback(
    (msg, type = "success") => {
      if (showToast) showToast(msg, type);
    },
    [showToast]
  );

  // Load CMS Data
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoadingPosts(true);
      try {
        const q = new URLSearchParams({ includeAll: "true", limit: "100" });
        if (postFilterStatus !== "all") q.set("status", postFilterStatus);
        if (postFilterCategory !== "all") q.set("category", postFilterCategory);
        if (postSearch.trim()) q.set("search", postSearch.trim());

        const [overviewRes, postsRes, catsRes, tagsRes, mediaRes, contentRes, themeRes] =
          await Promise.all([
            authFetch("/api/admin/cms/overview").catch(() => null),
            authFetch(`/api/blog/posts?${q.toString()}`).catch(() => null),
            authFetch("/api/blog/categories").catch(() => null),
            authFetch("/api/blog/hashtags").catch(() => null),
            authFetch("/api/admin/cms/media").catch(() => null),
            authFetch("/api/cms/content").catch(() => null),
            authFetch("/api/cms/theme").catch(() => null),
          ]);

        if (!isMounted) return;

        if (overviewRes && overviewRes.ok) {
          const d = await overviewRes.json();
          setOverview(d.summary || {});
          setActivityLogs(d.activityLogs || []);
        }
        if (postsRes && postsRes.ok) {
          const d = await postsRes.json();
          setPosts(d.posts || []);
        }
        if (catsRes && catsRes.ok) {
          const d = await catsRes.json();
          setCategories(d.categories || []);
        }
        if (tagsRes && tagsRes.ok) {
          const d = await tagsRes.json();
          setHashtags(d.hashtags || []);
        }
        if (mediaRes && mediaRes.ok) {
          const d = await mediaRes.json();
          setMediaItems(d.media || []);
        }
        if (contentRes && contentRes.ok) {
          const d = await contentRes.json();
          if (d.content) setEditableContentMap(d.content);
        }
        if (themeRes && themeRes.ok) {
          const d = await themeRes.json();
          if (d.theme) setDraftTheme({ ...DEFAULT_CMS_THEME, ...d.theme });
        }
      } catch (err) {
        console.warn("[AdminCmsTab] Load warning:", err.message);
      } finally {
        if (isMounted) setLoadingPosts(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [postFilterStatus, postFilterCategory, postSearch]);

  // ===========================================================================
  // BLOG COMPOSER HANDLERS
  // ===========================================================================
  const openCreateComposer = () => {
    setEditingPost(null);
    setPostForm({
      title: "",
      caption: "",
      content: "",
      post_type: "project_update",
      category_id: categories[0]?.category_id || "",
      author_name: "MCPA Construction and Supply",
      author_role: "MCPA Construction & Supply",
      status: "published",
      scheduled_for: "",
      media: [],
      hashtags: ["MCPAConstruction", "BuiltToLast"],
      link_preview: null,
      social_links: [],
    });
    setComposerOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
    }, 50);
  };

  const openEditComposer = (post) => {
    setEditingPost(post);
    setPostForm({
      title: post.title || "",
      caption: post.caption || "",
      content: post.content || "",
      post_type: post.post_type || "project_update",
      category_id: post.category_id || "",
      author_name: post.author_name || "MCPA Directorate",
      author_role: post.author_role || "Executive Directorate",
      status: post.status || "published",
      scheduled_for: post.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : "",
      media: Array.isArray(post.media) ? [...post.media] : [],
      hashtags: Array.isArray(post.hashtags)
        ? post.hashtags.map((h) => h.display_tag?.replace(/^#/, "") || h.tag)
        : [],
      link_preview: post.link_preview || null,
      social_links: Array.isArray(post.social_links)
        ? [...post.social_links]
        : Array.isArray(post.metadata?.social_links)
        ? [...post.metadata.social_links]
        : [],
    });
    setComposerOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = post.content || "";
    }, 50);
  };

  const execEditorCommand = (cmd, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    setPostForm((prev) => ({ ...prev, content: editorRef.current.innerHTML }));
  };

  const handleUploadFilesToPost = async (fileList, attachToComposer = true) => {
    const filesArray = Array.from(fileList || []);
    if (filesArray.length === 0) return;

    setUploadingMedia(true);
    setUploadProgress({ current: 0, total: filesArray.length });

    const allUploadedMedia = [];
    const batchSize = 3; // Upload in resilient batches so unlimited photos & large videos never time out

    try {
      for (let i = 0; i < filesArray.length; i += batchSize) {
        const batch = filesArray.slice(i, i + batchSize);
        const formData = new FormData();
        batch.forEach((file) => formData.append("files", file));
        formData.append("category", "blog");

        const res = await authFetch("/api/admin/cms/media/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.media)) {
          const added = data.media.map((m) => ({
            media_type:
              m.file_type?.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg)$/i.test(m.file_url || m.file_name || "")
                ? "video"
                : "image",
            url: m.file_url,
            file_name: m.file_name || m.title || "Uploaded Media",
            caption: "",
            alt_text: m.title || m.file_name || "MCPA Construction Media",
            file_size: m.file_size,
          }));
          allUploadedMedia.push(...added);

          if (attachToComposer) {
            setPostForm((prev) => ({
              ...prev,
              media: [...prev.media, ...added],
            }));
          }
        } else {
          notify(data.message || "A batch failed to upload.", "error");
        }

        setUploadProgress({
          current: Math.min(filesArray.length, i + batch.length),
          total: filesArray.length,
        });
      }

      if (allUploadedMedia.length > 0) {
        const imgCount = allUploadedMedia.filter((m) => m.media_type === "image").length;
        const vidCount = allUploadedMedia.filter((m) => m.media_type === "video").length;
        const parts = [];
        if (imgCount > 0) parts.push(`${imgCount} photo${imgCount > 1 ? "s" : ""}`);
        if (vidCount > 0) parts.push(`${vidCount} video${vidCount > 1 ? "s" : ""}`);
        notify(`Uploaded ${parts.join(" & ")} (${allUploadedMedia.length} file${allUploadedMedia.length > 1 ? "s" : ""})!`, "success");
        loadAllCmsData();
      }
    } catch (err) {
      notify("Error uploading files.", "error");
    } finally {
      setUploadingMedia(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const moveMediaItem = (index, direction) => {
    setPostForm((prev) => {
      const arr = [...prev.media];
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      const temp = arr[index];
      arr[index] = arr[targetIdx];
      arr[targetIdx] = temp;
      return { ...prev, media: arr };
    });
  };

  const removeMediaItem = (index) => {
    setPostForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  const handleFetchLinkPreview = async (urlToFetch) => {
    const target = urlToFetch || linkInputUrl;
    if (!target || !/^https?:\/\//i.test(target.trim())) return;
    setFetchingLinkPreview(true);
    try {
      const res = await authFetch("/api/admin/cms/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.preview) {
        setPostForm((prev) => ({ ...prev, link_preview: data.preview }));
        setLinkInputUrl("");
      }
    } catch (_) {
    } finally {
      setFetchingLinkPreview(false);
    }
  };

  const handleSavePost = async (overrideStatus) => {
    const finalStatus = overrideStatus || postForm.status || "published";
    if (!postForm.caption.trim() && !postForm.title.trim() && postForm.media.length === 0) {
      notify("Please write a caption, title, or attach media before saving.", "error");
      return;
    }

    setSavingPost(true);
    try {
      const payload = {
        ...postForm,
        status: finalStatus,
        content: editorRef.current ? editorRef.current.innerHTML : postForm.content,
      };

      const url = editingPost
        ? `/api/admin/blog/posts/${editingPost.post_id}`
        : "/api/admin/blog/posts";
      const method = editingPost ? "PUT" : "POST";

      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify(data.message || "Post saved and synchronized with website!", "success");
        setComposerOpen(false);
        setEditingPost(null);
        await loadAllCmsData();
        await refreshCms();
        notifyCmsUpdate();
      } else {
        notify(data.message || "Failed to save post.", "error");
      }
    } catch (err) {
      notify("Error saving post.", "error");
    } finally {
      setSavingPost(false);
    }
  };

  const handleDuplicatePost = async (postId) => {
    try {
      const res = await authFetch(`/api/admin/blog/posts/${postId}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        notify("Post duplicated as draft!", "success");
        loadAllCmsData();
      }
    } catch (_) {
      notify("Could not duplicate post.", "error");
    }
  };

  const handleDeletePostConfirmed = async () => {
    if (!deleteConfirmPost) return;
    try {
      const res = await authFetch(`/api/admin/blog/posts/${deleteConfirmPost.post_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notify("Post deleted permanently.", "success");
        setDeleteConfirmPost(null);
        loadAllCmsData();
        notifyCmsUpdate();
      }
    } catch (_) {
      notify("Failed to delete post.", "error");
    }
  };

  const handleQuickSwitchPublicLayout = async (newLayout) => {
    const updatedTheme = { ...draftTheme, defaultBlogLayout: newLayout };
    setDraftTheme(updatedTheme);
    try {
      const res = await authFetch("/api/admin/cms/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: updatedTheme }),
      });
      if (res.ok) {
        try {
          localStorage.removeItem("mcpa-user-layout-override");
        } catch (_) {}
        await refreshCms();
        notifyCmsUpdate();
        notify(`Public blog layout switched to ${newLayout.toUpperCase()} View!`, "success");
      }
    } catch (_) {
      notify("Failed to switch default blog layout.", "error");
    }
  };

  // ===========================================================================
  // WEBSITE-WIDE DYNAMIC CONTENT HANDLERS
  // ===========================================================================
  const handleContentFieldChange = (pageKey, sectionKey, contentKey, newValue) => {
    setEditableContentMap((prev) => ({
      ...prev,
      [pageKey]: {
        ...(prev[pageKey] || {}),
        [sectionKey]: {
          ...(prev[pageKey]?.[sectionKey] || {}),
          [contentKey]: newValue,
        },
      },
    }));
  };

  const handleSavePageContent = async (pageKey) => {
    setSavingContent(true);
    try {
      const pageData = editableContentMap[pageKey] || {};
      const items = [];
      for (const sKey of Object.keys(pageData)) {
        const fields = pageData[sKey] || {};
        for (const cKey of Object.keys(fields)) {
          items.push({
            page_key: pageKey,
            section_key: sKey,
            content_key: cKey,
            content_value: fields[cKey],
            content_type: "text",
          });
        }
      }

      const res = await authFetch("/api/admin/cms/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCms();
        notifyCmsUpdate();
        notify(`Saved & published ${pageKey.toUpperCase()} content live to website!`, "success");
        loadAllCmsData();
      } else {
        notify(data.message || "Failed to save content.", "error");
      }
    } catch (err) {
      notify("Error saving website content.", "error");
    } finally {
      setSavingContent(false);
    }
  };

  // ===========================================================================
  // WEBSITE APPEARANCE & THEME HANDLERS
  // ===========================================================================
  const handleThemeChange = (field, value) => {
    const updated = { ...draftTheme, [field]: value };
    setDraftTheme(updated);
    previewTheme(updated);
  };

  const handlePublishTheme = async () => {
    setSavingTheme(true);
    try {
      const res = await authFetch("/api/admin/cms/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: draftTheme }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshCms();
        notifyCmsUpdate();
        notify("Website appearance & theme published globally!", "success");
      } else {
        notify(data.message || "Failed to publish theme.", "error");
      }
    } catch (_) {
      notify("Error saving theme.", "error");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleResetTheme = async () => {
    setSavingTheme(true);
    try {
      const res = await authFetch("/api/admin/cms/theme/reset", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setDraftTheme(DEFAULT_CMS_THEME);
        previewTheme(DEFAULT_CMS_THEME);
        await refreshCms();
        notifyCmsUpdate();
        notify("Theme reset to official MCPA Signature Amber defaults.", "success");
      }
    } catch (_) {
    } finally {
      setSavingTheme(false);
    }
  };

  // ===========================================================================
  // MEDIA LIBRARY HANDLERS
  // ===========================================================================
  const handleDeleteMedia = async (mediaId, force = false) => {
    try {
      const res = await authFetch(
        `/api/admin/cms/media/${mediaId}${force ? "?force=true" : ""}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.status === 409 && data.inUse) {
        setMediaDeleteWarning({ mediaId, ...data });
        return;
      }
      if (res.ok && data.success) {
        setMediaDeleteWarning(null);
        notify("Media removed from library.", "success");
        loadAllCmsData();
      } else {
        notify(data.message || "Could not delete media.", "error");
      }
    } catch (_) {
      notify("Error deleting media.", "error");
    }
  };

  const currentPageSchema =
    PAGE_SECTIONS_SCHEMA.find((p) => p.pageKey === activePageKey) || PAGE_SECTIONS_SCHEMA[0];

  return (
    <div className="space-y-6">
      {/* TOP SUB-NAVIGATION BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#10131a] p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs">
        <div className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-950 dark:text-white">
              Website Content &amp; Social Blog Manager
            </h2>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
            >
              <span>View Live Blog</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Sub-Tabs with Horizontal Scroll */}
        <div className="w-full lg:w-auto overflow-x-auto pb-1.5 pt-0.5 flex items-center gap-2 max-w-full scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-neutral-100 dark:scrollbar-track-white/5">
          {[
            { id: "blog", label: "Blog & Posts", icon: Newspaper },
            { id: "website-content", label: "Website Content", icon: Globe },
            { id: "media-library", label: "Media Library", icon: ImageIcon },
            { id: "appearance", label: "Website Appearance", icon: Palette },
            { id: "categories-logs", label: "Categories & Logs", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  active
                    ? "bg-amber-500 text-neutral-950 shadow-xs"
                    : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI SUMMARY STRIP */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Published Posts", value: overview.published_posts ?? 0, sub: `${overview.total_posts ?? 0} total` },
            { label: "Drafts / Scheduled", value: (overview.draft_posts ?? 0) + (overview.scheduled_posts ?? 0), sub: "Ready to publish" },
            { label: "Media Library", value: overview.total_media ?? 0, sub: formatBytes(overview.total_bytes) },
            { label: "Categories", value: overview.total_categories ?? 0, sub: "Active topics" },
            { label: "Hashtags", value: overview.total_hashtags ?? 0, sub: "Indexed tags" },
            { label: "Dynamic Keys", value: overview.total_content_keys ?? 0, sub: "Live CMS fields" },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 p-4"
            >
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                {stat.label}
              </div>
              <div className="text-2xl font-extrabold text-neutral-950 dark:text-white mt-1">
                {stat.value}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 1: SOCIAL MEDIA BLOG & POSTS MANAGER
         ===================================================================== */}
      {activeSubTab === "blog" && (
        <div className="space-y-6">
          {/* Action Bar & Default Public Layout Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#10131a] p-4 rounded-2xl border border-neutral-200 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openCreateComposer}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Post</span>
              </button>

              {/* Status Filter */}
              <select
                value={postFilterStatus}
                onChange={(e) => setPostFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-semibold outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>

              {/* Category Filter */}
              <select
                value={postFilterCategory}
                onChange={(e) => setPostFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-semibold outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="pl-8 pr-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Public Blog Default Layout Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500">Default Public Layout:</span>
              <div className="inline-flex items-center bg-neutral-100 dark:bg-white/5 p-1 rounded-xl border border-neutral-200 dark:border-white/10">
                {[
                  { id: "feed", label: "Feed" },
                  { id: "grid", label: "Grid" },
                  { id: "table", label: "Table" },
                  { id: "article", label: "Article" },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => handleQuickSwitchPublicLayout(l.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      draftTheme.defaultBlogLayout === l.id
                        ? "bg-amber-500 text-neutral-950"
                        : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* POST COMPOSER MODAL / DRAWER */}
          {composerOpen && (
            <div className="rounded-3xl bg-white dark:bg-[#10131a] border-2 border-amber-500/40 shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                    {editingPost ? `Editing Post #${editingPost.post_id}` : "New Social Blog Publication"}
                  </span>
                  <h3 className="text-xl font-extrabold text-neutral-950 dark:text-white">
                    {editingPost ? "Update Blog Post" : "Create Social Media Blog Post"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="p-2 rounded-full bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 text-neutral-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 Cols: Caption, WYSIWYG Editor & Media */}
                <div className="lg:col-span-8 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Post Headline / Title (Optional for short updates, recommended for articles)
                    </label>
                    <input
                      type="text"
                      value={postForm.title}
                      onChange={(e) => setPostForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g., Structural Milestone: 2nd-Floor Slab Pouring Completed in Plaridel"
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-sm font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Social Feed Caption (Supports #Hashtags &amp; Auto-Clickable URLs)
                    </label>
                    <textarea
                      rows={4}
                      value={postForm.caption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPostForm((p) => ({ ...p, caption: val }));
                        // Auto-detect pasted URL for link preview if none attached yet
                        const urlMatch = val.match(/https?:\/\/[^\s]+/i);
                        if (urlMatch && !postForm.link_preview && !fetchingLinkPreview) {
                          handleFetchLinkPreview(urlMatch[0]);
                        }
                      }}
                      placeholder="Share construction progress, project updates, announcements, or behind-the-scenes stories... Type #MCPAConstruction #ConstructionProgress"
                      className="w-full p-4 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-sm outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* WYSIWYG Rich Text Body Editor */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                      Rich-Text Article Body (WYSIWYG Editor)
                    </label>
                    <div className="rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden bg-neutral-50 dark:bg-white/[0.03]">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center flex-wrap gap-1 p-2 border-b border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900">
                        {[
                          { icon: Bold, cmd: "bold", title: "Bold" },
                          { icon: Italic, cmd: "italic", title: "Italic" },
                          { icon: Underline, cmd: "underline", title: "Underline" },
                          { icon: Strikethrough, cmd: "strikeThrough", title: "Strikethrough" },
                          { icon: Heading1, cmd: "formatBlock", arg: "H2", title: "Heading 2" },
                          { icon: Heading2, cmd: "formatBlock", arg: "H3", title: "Heading 3" },
                          { icon: List, cmd: "insertUnorderedList", title: "Bullet List" },
                          { icon: ListOrdered, cmd: "insertOrderedList", title: "Numbered List" },
                          { icon: Quote, cmd: "formatBlock", arg: "BLOCKQUOTE", title: "Blockquote" },
                          { icon: AlignLeft, cmd: "justifyLeft", title: "Align Left" },
                          { icon: AlignCenter, cmd: "justifyCenter", title: "Align Center" },
                          { icon: AlignRight, cmd: "justifyRight", title: "Align Right" },
                          { icon: Minus, cmd: "insertHorizontalRule", title: "Horizontal Divider" },
                        ].map((btn, i) => {
                          const Icon = btn.icon;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => execEditorCommand(btn.cmd, btn.arg || null)}
                              title={btn.title}
                              className="p-2 rounded-lg hover:bg-amber-500/20 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt("Enter URL to link:");
                            if (url) execEditorCommand("createLink", url);
                          }}
                          title="Insert Link"
                          className="p-2 rounded-lg hover:bg-amber-500/20 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) =>
                          setPostForm((prev) => ({ ...prev, content: e.currentTarget.innerHTML }))
                        }
                        className="min-h-[160px] max-h-[340px] overflow-y-auto p-4 text-sm text-neutral-900 dark:text-neutral-100 outline-none prose prose-sm dark:prose-invert max-w-none"
                      />
                    </div>
                  </div>

                  {/* Unlimited Multi-Image & Multi-Video Direct File Upload Area */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverComposer(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverComposer(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingOverComposer(false);
                      if (e.dataTransfer?.files?.length) {
                        handleUploadFilesToPost(e.dataTransfer.files, true);
                      }
                    }}
                    className={`space-y-3 p-4 rounded-2xl border-2 transition-all ${
                      isDraggingOverComposer
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-neutral-200 dark:border-white/10 bg-neutral-50/60 dark:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <label className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                          <span>Attached Photos &amp; Videos ({postForm.media.length})</span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-mono">
                            UNLIMITED FILES
                          </span>
                        </label>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {postForm.media.filter((m) => m.media_type !== "video").length} Photo(s) &bull;{" "}
                          {postForm.media.filter((m) => m.media_type === "video").length} Video(s) attached — Upload as many image &amp; video files as you want from your device.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Direct Multi-Photo File Upload */}
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-extrabold cursor-pointer shadow-xs transition-all">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>+ Upload Photos</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              handleUploadFilesToPost(e.target.files, true);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Direct Multi-Video File Upload */}
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 dark:bg-white hover:opacity-90 text-white dark:text-neutral-950 text-xs font-extrabold cursor-pointer shadow-xs transition-all">
                          <Film className="w-3.5 h-3.5" />
                          <span>+ Upload Videos</span>
                          <input
                            type="file"
                            multiple
                            accept="video/*"
                            onChange={(e) => {
                              handleUploadFilesToPost(e.target.files, true);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Mixed Unlimited File Upload */}
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-200/80 dark:bg-white/10 hover:bg-amber-500/20 text-neutral-800 dark:text-neutral-200 text-xs font-bold cursor-pointer transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>+ Mixed Files</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={(e) => {
                              handleUploadFilesToPost(e.target.files, true);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLibraryUrls([]);
                            setMediaPickerModalOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-amber-500/20 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
                        >
                          Media Library
                        </button>

                        {postForm.media.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setPostForm((prev) => ({ ...prev, media: [] }))}
                            className="px-2.5 py-2 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-500/10 cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live Multi-File Upload Progress Banner */}
                    {uploadingMedia && (
                      <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                          <span>
                            Uploading files to cloud storage ({uploadProgress.current} of {uploadProgress.total})...
                          </span>
                          <span>
                            {uploadProgress.total > 0
                              ? `${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`
                              : ""}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{
                              width: `${
                                uploadProgress.total > 0
                                  ? Math.max(10, Math.round((uploadProgress.current / uploadProgress.total) * 100))
                                  : 50
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {postForm.media.length === 0 ? (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-300 dark:border-white/15 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-500 transition-colors bg-white/60 dark:bg-black/20">
                        <div className="flex items-center gap-2 mb-2 text-amber-500">
                          <ImageIcon className="w-7 h-7" />
                          <Film className="w-7 h-7" />
                          <Upload className="w-7 h-7" />
                        </div>
                        <span className="text-xs sm:text-sm font-extrabold text-neutral-800 dark:text-neutral-200">
                          Click to select or drag &amp; drop unlimited photos and videos from your device
                        </span>
                        <span className="text-[11px] text-neutral-500 mt-1">
                          Select 1, 10, 50, or 100+ files at once (JPG, PNG, WebP, HEIC, MP4, WebM, MOV) — Direct file upload, no URL links needed
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => {
                            handleUploadFilesToPost(e.target.files, true);
                            e.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {postForm.media.map((m, idx) => (
                          <div
                            key={`${m.url}-${idx}`}
                            className="relative group rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-900 overflow-hidden flex flex-col"
                          >
                            <div className="relative aspect-square w-full bg-black">
                              {m.media_type === "video" ? (
                                <video
                                  src={m.url}
                                  controls
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img src={m.url} alt="" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-2 left-2 flex items-center gap-1">
                                <span className="px-2 py-0.5 rounded bg-black/80 text-amber-400 font-mono text-[10px] font-bold">
                                  #{idx + 1}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-black/80 text-white font-mono text-[9px] uppercase">
                                  {m.media_type === "video" ? "VIDEO" : "PHOTO"}
                                </span>
                              </div>
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveMediaItem(idx, -1)}
                                  disabled={idx === 0}
                                  className="p-1 rounded bg-black/80 text-white hover:bg-amber-500 hover:text-black disabled:opacity-30 cursor-pointer"
                                  title="Move Earlier"
                                >
                                  <ArrowLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveMediaItem(idx, 1)}
                                  disabled={idx === postForm.media.length - 1}
                                  className="p-1 rounded bg-black/80 text-white hover:bg-amber-500 hover:text-black disabled:opacity-30 cursor-pointer"
                                  title="Move Later"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMediaItem(idx)}
                                  className="p-1 rounded bg-red-600/90 text-white hover:bg-red-500 cursor-pointer"
                                  title="Remove File"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={m.caption || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPostForm((prev) => {
                                  const next = [...prev.media];
                                  next[idx] = { ...next[idx], caption: val };
                                  return { ...prev, media: next };
                                });
                              }}
                              placeholder="Optional photo/video caption..."
                              className="px-2.5 py-1.5 text-[11px] bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-t border-neutral-200 dark:border-white/10 outline-none"
                            />
                          </div>
                        ))}

                        {/* Persistent "+ Add More Files (Unlimited)" Tile inside the Grid */}
                        <label className="aspect-square rounded-xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all">
                          <Plus className="w-7 h-7 text-amber-500 mb-1" />
                          <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                            + Add More Files
                          </span>
                          <span className="text-[10px] text-neutral-500 mt-0.5">
                            Unlimited Photos &amp; Videos
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={(e) => {
                              handleUploadFilesToPost(e.target.files, true);
                              e.target.value = "";
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 4 Cols: Category, Hashtags, Link Preview & Publishing */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Category &amp; Post Classification
                    </label>
                    <select
                      value={postForm.category_id}
                      onChange={(e) => setPostForm((p) => ({ ...p, category_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={postForm.post_type}
                      onChange={(e) => setPostForm((p) => ({ ...p, post_type: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
                    >
                      <option value="project_update">Construction Project Update</option>
                      <option value="announcement">Company Announcement</option>
                      <option value="completed_works">Project Completion Handover</option>
                      <option value="behind_the_scenes">Behind-the-Scenes Content</option>
                      <option value="article">Informational Engineering Article</option>
                      <option value="promotional">Promotional / BNPL Offer</option>
                    </select>
                  </div>

                  {/* Hashtags Input */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Hashtags (#)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={hashtagInput}
                        onChange={(e) => setHashtagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && hashtagInput.trim()) {
                            e.preventDefault();
                            const clean = hashtagInput.replace(/^#/, "").trim();
                            if (clean && !postForm.hashtags.includes(clean)) {
                              setPostForm((p) => ({ ...p, hashtags: [...p.hashtags, clean] }));
                            }
                            setHashtagInput("");
                          }
                        }}
                        placeholder="Add hashtag (e.g. ModernHouse)"
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = hashtagInput.replace(/^#/, "").trim();
                          if (clean && !postForm.hashtags.includes(clean)) {
                            setPostForm((p) => ({ ...p, hashtags: [...p.hashtags, clean] }));
                          }
                          setHashtagInput("");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {postForm.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() =>
                              setPostForm((p) => ({
                                ...p,
                                hashtags: p.hashtags.filter((t) => t !== tag),
                              }))
                            }
                            className="hover:text-red-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Suggested Hashtags */}
                    <div className="pt-2 border-t border-neutral-200/60 dark:border-white/10">
                      <span className="block text-[10px] font-mono uppercase text-neutral-400 mb-1.5">
                        Click to add popular tags:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          "MCPAConstruction",
                          "ConstructionProgress",
                          "ModernHouse",
                          "ProjectUpdates",
                          "DesignAndBuild",
                          "BuiltToLast",
                        ].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => {
                              if (!postForm.hashtags.includes(sug)) {
                                setPostForm((p) => ({ ...p, hashtags: [...p.hashtags, sug] }));
                              }
                            }}
                            className="text-[11px] px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-white/5 hover:bg-amber-500/20 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                          >
                            #{sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Link Preview Attachment */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Attach External Link Preview
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={linkInputUrl}
                        onChange={(e) => setLinkInputUrl(e.target.value)}
                        placeholder="https://www.mcpaconstruction.com/..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleFetchLinkPreview()}
                        disabled={fetchingLinkPreview}
                        className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs cursor-pointer"
                      >
                        {fetchingLinkPreview ? "..." : "Fetch"}
                      </button>
                    </div>
                    {postForm.link_preview && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-amber-500/30 text-xs flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-bold truncate">{postForm.link_preview.title}</div>
                          <div className="text-[11px] text-neutral-500 truncate">{postForm.link_preview.url}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPostForm((p) => ({ ...p, link_preview: null }))}
                          className="text-red-500 hover:underline shrink-0 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Social Media Cross-Post Links */}
                  <SocialLinksInputManager
                    links={postForm.social_links || []}
                    onChange={(newLinks) => setPostForm((p) => ({ ...p, social_links: newLinks }))}
                  />

                  {/* Visibility & Scheduling */}
                  <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Publication Status &amp; Schedule
                    </label>
                    <select
                      value={postForm.status}
                      onChange={(e) => setPostForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
                    >
                      <option value="published">Publish Immediately</option>
                      <option value="draft">Save as Draft</option>
                      <option value="scheduled">Schedule Publication</option>
                    </select>

                    {postForm.status === "scheduled" && (
                      <input
                        type="datetime-local"
                        value={postForm.scheduled_for}
                        onChange={(e) => setPostForm((p) => ({ ...p, scheduled_for: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs outline-none"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSavePost("draft")}
                        disabled={savingPost}
                        className="px-3 py-2.5 rounded-xl bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 font-bold text-xs cursor-pointer"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSavePost("published")}
                        disabled={savingPost}
                        className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer"
                      >
                        {savingPost ? "Publishing..." : "Publish Now"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PUBLISHED / DRAFT POSTS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <div
                key={post.post_id}
                className="rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Cover Media */}
                  <div className="relative h-44 bg-neutral-900 overflow-hidden">
                    {post.media?.[0]?.media_type === "video" ? (
                      <video src={post.media[0].url} muted className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={
                          post.featured_image ||
                          post.media?.[0]?.url ||
                          "/assets/hero-residence-day-wide-v2.jpg"
                        }
                        alt={post.title || "Post"}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          post.status === "published"
                            ? "bg-emerald-500 text-neutral-950"
                            : post.status === "scheduled"
                            ? "bg-blue-500 text-white"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {post.status}
                      </span>
                      {post.media?.length > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-black/75 text-amber-400 text-[10px] font-mono">
                          {post.media.length} media
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                      {post.category_name || "General Update"}
                    </div>
                    <h4 className="font-bold text-sm text-neutral-950 dark:text-white line-clamp-2">
                      {post.title || post.caption?.substring(0, 70)}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {post.caption}
                    </p>
                  </div>

                  {/* Social cross-post links */}
                  {(post.social_links?.length > 0 || post.metadata?.social_links?.length > 0) && (
                    <div className="px-4 pb-2">
                      <SocialCrossPostBadges
                        links={post.social_links || post.metadata?.social_links}
                        compact={true}
                        showHeader={false}
                      />
                    </div>
                  )}
                </div>

                {/* Admin Actions Footer */}
                <div className="px-4 py-3 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-200/70 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditComposer(post)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-neutral-950 font-bold transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicatePost(post.post_id)}
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500 cursor-pointer"
                      title="Duplicate Post"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500"
                      title="View Public Post"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmPost(post)}
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-red-500 cursor-pointer"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: WEBSITE-WIDE DYNAMIC CONTENT MANAGEMENT
         ===================================================================== */}
      {activeSubTab === "website-content" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative">
          {/* Left Page Selector (Sticky while scrolling content) */}
          <div className="lg:col-span-3 space-y-2 lg:sticky lg:top-20 self-start z-10" style={{ position: "sticky", top: "5rem" }}>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-1.5 shadow-xs max-h-[calc(100vh-6.5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500/30">
              <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 px-2 pb-1">
                Select Website Page
              </div>
              {PAGE_SECTIONS_SCHEMA.map((page) => {
                const active = activePageKey === page.pageKey;
                return (
                  <button
                    key={page.pageKey}
                    type="button"
                    onClick={() => setActivePageKey(page.pageKey)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      active
                        ? "bg-amber-500 text-neutral-950 shadow-xs"
                        : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{page.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Section Fields Editor */}
          <div className="lg:col-span-9 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-950 dark:text-white">
                  {currentPageSchema.label} — Live Content Editor
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">{currentPageSchema.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleSavePageContent(currentPageSchema.pageKey)}
                disabled={savingContent}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{savingContent ? "Publishing..." : "Save & Publish Changes"}</span>
              </button>
            </div>

            {currentPageSchema.sections.map((section) => (
              <div
                key={section.sectionKey}
                className="p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4"
              >
                <div className="pb-3 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                  <h4 className="font-bold text-sm text-neutral-950 dark:text-white">
                    {section.title}
                  </h4>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {currentPageSchema.pageKey}.{section.sectionKey}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field) => {
                    const val =
                      editableContentMap?.[currentPageSchema.pageKey]?.[section.sectionKey]?.[
                        field.key
                      ] ?? "";
                    return (
                      <div
                        key={field.key}
                        className={field.type === "textarea" ? "md:col-span-2" : ""}
                      >
                        <label className="block text-xs font-bold text-neutral-600 dark:text-neutral-300 mb-1.5">
                          {field.label}
                          <span className="ml-2 text-[10px] font-mono text-neutral-400">
                            ({field.key})
                          </span>
                        </label>
                        {field.type === "media" ? (
                          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {val ? (
                                (/\.(mp4|webm|mov)$/i.test(val) || val.includes("/videos/")) ? (
                                  <video
                                    src={val}
                                    muted
                                    controls
                                    className="w-28 h-20 rounded-lg object-cover bg-black shrink-0 border border-amber-500/40 shadow"
                                  />
                                ) : (
                                  <img
                                    src={val}
                                    alt=""
                                    className="w-28 h-20 rounded-lg object-cover bg-black shrink-0 border border-amber-500/40 shadow"
                                  />
                                )
                              ) : (
                                <div className="w-28 h-20 rounded-lg bg-neutral-200 dark:bg-white/10 flex flex-col items-center justify-center text-[10px] text-neutral-500 shrink-0 border border-dashed border-neutral-300 dark:border-white/20">
                                  <ImageIcon className="w-5 h-5 text-neutral-400 mb-1" />
                                  <span>Default Asset</span>
                                </div>
                              )}

                              <div className="flex-1 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Direct Upload Button */}
                                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs cursor-pointer shadow-sm">
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{uploadingMedia ? "Uploading..." : "Upload New"}</span>
                                    <input
                                      type="file"
                                      accept="image/*,video/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = "";
                                        if (!file) return;
                                        setUploadingMedia(true);
                                        try {
                                          const fd = new FormData();
                                          fd.append("files", file);
                                          fd.append("category", "website");
                                          const r = await authFetch("/api/admin/cms/media/upload", {
                                            method: "POST",
                                            body: fd,
                                          });
                                          const d = await r.json();
                                          if (r.ok && d.media?.[0]?.file_url) {
                                            handleContentFieldChange(
                                              currentPageSchema.pageKey,
                                              section.sectionKey,
                                              field.key,
                                              d.media[0].file_url
                                            );
                                            notify("Media file uploaded & assigned! Click Save & Publish Changes to apply.", "success");
                                            loadAllCmsData();
                                          }
                                        } catch (_) {
                                          notify("File upload failed.", "error");
                                        } finally {
                                          setUploadingMedia(false);
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* Select from Media Library */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCmsMediaPickerTarget({
                                        pageKey: currentPageSchema.pageKey,
                                        sectionKey: section.sectionKey,
                                        contentKey: field.key,
                                      });
                                      setMediaPickerModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 font-bold text-xs cursor-pointer"
                                  >
                                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                                    <span>From Media Library</span>
                                  </button>

                                  {/* Clear / Reset Button */}
                                  {val ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleContentFieldChange(
                                          currentPageSchema.pageKey,
                                          section.sectionKey,
                                          field.key,
                                          ""
                                        );
                                        notify("Media reset to default asset. Click Save & Publish to apply.", "info");
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Reset Default</span>
                                    </button>
                                  ) : null}
                                </div>

                                {/* Direct Path / URL input */}
                                <input
                                  type="text"
                                  value={val}
                                  placeholder="File path or URL (e.g. /videos/... or https://...)"
                                  onChange={(e) =>
                                    handleContentFieldChange(
                                      currentPageSchema.pageKey,
                                      section.sectionKey,
                                      field.key,
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-[11px] font-mono outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        ) : field.type === "textarea" ? (
                          <textarea
                            rows={3}
                            value={val}
                            onChange={(e) =>
                              handleContentFieldChange(
                                currentPageSchema.pageKey,
                                section.sectionKey,
                                field.key,
                                e.target.value
                              )
                            }
                            className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs sm:text-sm outline-none focus:border-amber-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              handleContentFieldChange(
                                currentPageSchema.pageKey,
                                section.sectionKey,
                                field.key,
                                e.target.value
                              )
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs sm:text-sm outline-none focus:border-amber-500"
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Render any dynamic custom fields added by admin that are not in schema */}
                  {(() => {
                    const knownKeys = new Set(section.fields.map((f) => f.key));
                    const sectionCustomData =
                      editableContentMap?.[currentPageSchema.pageKey]?.[section.sectionKey] || {};
                    const extraKeys = Object.keys(sectionCustomData).filter((k) => !knownKeys.has(k));

                    return extraKeys.map((cKey) => {
                      const cVal = sectionCustomData[cKey] ?? "";
                      const isMedia =
                        cKey.toLowerCase().includes("media") ||
                        cKey.toLowerCase().includes("src") ||
                        cKey.toLowerCase().includes("poster") ||
                        cKey.toLowerCase().includes("video") ||
                        cKey.toLowerCase().includes("image");

                      return (
                        <div key={cKey} className="md:col-span-2 p-3.5 rounded-xl bg-neutral-100/60 dark:bg-white/[0.03] border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                              Custom Field: {cKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleContentFieldChange(
                                  currentPageSchema.pageKey,
                                  section.sectionKey,
                                  cKey,
                                  ""
                                );
                                notify(`Cleared ${cKey}. Click Save & Publish to apply.`, "info");
                              }}
                              className="text-[11px] text-red-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete Key</span>
                            </button>
                          </div>

                          {isMedia ? (
                            <div className="flex items-center gap-3">
                              {cVal ? (
                                cVal.match(/\.(mp4|webm|mov)$/i) ? (
                                  <video src={cVal} muted controls className="w-24 h-16 rounded-lg object-cover bg-black" />
                                ) : (
                                  <img src={cVal} alt="" className="w-24 h-16 rounded-lg object-cover bg-black" />
                                )
                              ) : null}
                              <input
                                type="text"
                                value={cVal}
                                onChange={(e) =>
                                  handleContentFieldChange(
                                    currentPageSchema.pageKey,
                                    section.sectionKey,
                                    cKey,
                                    e.target.value
                                  )
                                }
                                placeholder="Image or Video URL / path..."
                                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-xs font-mono"
                              />
                            </div>
                          ) : (
                            <textarea
                              rows={2}
                              value={cVal}
                              onChange={(e) =>
                                handleContentFieldChange(
                                  currentPageSchema.pageKey,
                                  section.sectionKey,
                                  cKey,
                                  e.target.value
                                )
                              }
                              className="w-full p-2.5 rounded-lg bg-white dark:bg-black/40 border border-neutral-200 dark:border-white/10 text-xs sm:text-sm"
                            />
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Add Custom Field Inline Box */}
                {addingFieldToSection?.sectionKey === section.sectionKey ? (
                  <div className="mt-4 p-4 rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">
                        Add New Custom Field to [{section.title}]
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingFieldToSection(null);
                          setNewFieldKey("");
                          setNewFieldType("text");
                        }}
                        className="text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                        placeholder="Key name (e.g. promoBannerText)"
                        className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs font-mono"
                      />
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-xs"
                      >
                        <option value="text">Text (Single Line)</option>
                        <option value="textarea">Textarea (Multiline)</option>
                        <option value="media">Photo / Video Media</option>
                      </select>
                      <button
                        type="button"
                        disabled={!newFieldKey.trim()}
                        onClick={() => {
                          if (!newFieldKey.trim()) return;
                          handleContentFieldChange(
                            currentPageSchema.pageKey,
                            section.sectionKey,
                            newFieldKey.trim(),
                            ""
                          );
                          notify(`Created field "${newFieldKey.trim()}"! Enter content and click Save & Publish.`, "success");
                          setAddingFieldToSection(null);
                          setNewFieldKey("");
                        }}
                        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-xs"
                      >
                        + Create Field
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingFieldToSection({
                          pageKey: currentPageSchema.pageKey,
                          sectionKey: section.sectionKey,
                        });
                        setNewFieldKey("");
                        setNewFieldType("text");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-amber-500/40 hover:border-amber-500 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/10 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Field to this Section</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: CENTRALIZED MEDIA LIBRARY
         ===================================================================== */}
      {activeSubTab === "media-library" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#10131a] p-4 rounded-2xl border border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              {["all", "image", "video"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMediaFilterType(t)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize cursor-pointer ${
                    mediaFilterType === t
                      ? "bg-amber-500 text-neutral-950"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400"
                  }`}
                >
                  {t === "all" ? "All Media" : `${t}s`}
                </button>
              ))}
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="Search filename or caption..."
                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs outline-none"
              />
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>
                {uploadingMedia
                  ? `Uploading (${uploadProgress.current}/${uploadProgress.total})...`
                  : "+ Upload Unlimited Photos & Videos"}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  handleUploadFilesToPost(e.target.files, false);
                  e.target.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaItems
              .filter((m) => {
                if (mediaFilterType === "image" && !m.file_type?.startsWith("image/")) return false;
                if (mediaFilterType === "video" && !m.file_type?.startsWith("video/")) return false;
                if (
                  mediaSearch &&
                  !`${m.title} ${m.file_name}`.toLowerCase().includes(mediaSearch.toLowerCase())
                )
                  return false;
                return true;
              })
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-square bg-neutral-950">
                    {item.file_type?.startsWith("video/") ? (
                      <video src={item.file_url} muted controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={item.file_url} alt={item.title || ""} className="w-full h-full object-cover" />
                    )}
                    {item.active_references > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-bold">
                        In Use ({item.active_references})
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-xs font-bold truncate" title={item.title || item.file_name}>
                      {item.title || item.file_name}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                      <span>{formatBytes(item.file_size)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(item.file_url);
                            notify("Media URL copied!", "success");
                          }}
                          className="p-1 hover:text-amber-500 cursor-pointer"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(item.id, false)}
                          className="p-1 hover:text-red-500 cursor-pointer"
                          title="Delete Media"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: WEBSITE APPEARANCE & THEME CUSTOMIZER
         ===================================================================== */}
      {activeSubTab === "appearance" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Theme Controls */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-neutral-950 dark:text-white">
                  Brand Color &amp; Typography Controls
                </h3>
                <button
                  type="button"
                  onClick={handleResetTheme}
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-amber-500 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Curated Architectural Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        const next = { ...draftTheme, ...preset, presetName: preset.name };
                        setDraftTheme(next);
                        previewTheme(next);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                        draftTheme.presetName === preset.name
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-neutral-200 dark:border-white/10 hover:border-amber-500/40"
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 border border-white/20"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span className="text-xs font-bold truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "primaryColor", label: "Primary Brand Color" },
                  { key: "accentColor", label: "Accent / Hover Color" },
                  { key: "secondaryColor", label: "Secondary Slate Color" },
                  { key: "surfaceDark", label: "Dark Theme Surface" },
                ].map((c) => (
                  <div key={c.key} className="p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                    <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">
                      {c.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftTheme[c.key] || "#f59e0b"}
                        onChange={(e) => handleThemeChange(c.key, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={draftTheme[c.key] || ""}
                        onChange={(e) => handleThemeChange(c.key, e.target.value)}
                        className="w-full text-xs font-mono bg-transparent outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Typography Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">
                    Heading Font Family
                  </label>
                  <select
                    value={draftTheme.headingFont}
                    onChange={(e) => handleThemeChange("headingFont", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
                  >
                    {CURATED_WEB_FONTS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 mb-1">
                    Body Font Family
                  </label>
                  <select
                    value={draftTheme.bodyFont}
                    onChange={(e) => handleThemeChange("bodyFont", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-bold outline-none"
                  >
                    {CURATED_WEB_FONTS.map((f) => (
                      <option key={f.name} value={f.name}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePublishTheme}
                disabled={savingTheme}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-wider shadow-lg cursor-pointer"
              >
                {savingTheme ? "Publishing..." : "Save & Publish Appearance Globally"}
              </button>
            </div>
          </div>

          {/* Right 7 Cols: Interactive Responsive Live Preview (Sticky) */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-20 self-start" style={{ position: "sticky", top: "5rem" }}>
            <div className="p-4 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Live Responsive Theme Preview
              </span>
              <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl">
                {[
                  { id: "desktop", icon: Monitor, label: "Desktop" },
                  { id: "tablet", icon: Tablet, label: "Tablet" },
                  { id: "mobile", icon: Smartphone, label: "Mobile" },
                ].map((vp) => {
                  const Icon = vp.icon;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => setPreviewViewport(vp.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        previewViewport === vp.id
                          ? "bg-amber-500 text-neutral-950"
                          : "text-neutral-500"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{vp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-center bg-neutral-200/50 dark:bg-black/40 p-6 rounded-3xl border border-neutral-200 dark:border-white/10">
              <div
                style={{
                  backgroundColor: draftTheme.surfaceDark || "#080a0e",
                  fontFamily: draftTheme.bodyFont || "Plus Jakarta Sans",
                }}
                className={`rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-6 text-white space-y-5 transition-all duration-300 ${
                  previewViewport === "mobile"
                    ? "w-[340px]"
                    : previewViewport === "tablet"
                    ? "w-[560px]"
                    : "w-full"
                }`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-extrabold tracking-tight text-sm">MCPA CONSTRUCTION</span>
                  <span
                    style={{ backgroundColor: draftTheme.primaryColor }}
                    className="px-3 py-1 rounded-lg text-neutral-950 text-xs font-bold"
                  >
                    Inquire Now!
                  </span>
                </div>
                <div className="space-y-2 py-4">
                  <span
                    style={{ color: draftTheme.primaryColor }}
                    className="text-[11px] font-bold uppercase tracking-widest"
                  >
                    {editableContentMap?.home?.hero?.heroBadge || "Build Now, Pay Later Available"}
                  </span>
                  <h4
                    style={{ fontFamily: draftTheme.headingFont }}
                    className="text-2xl font-extrabold leading-tight"
                  >
                    {editableContentMap?.home?.hero?.heroHeading ||
                      "Looking to turn your ideas into reality?"}
                  </h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Collaborate with us at MCPA Construction and Supply and let&apos;s build your enduring legacy.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div
                      style={{ color: draftTheme.primaryColor }}
                      className="text-lg font-extrabold"
                    >
                      15-Yr
                    </div>
                    <div className="text-[11px] text-neutral-400">Structural Warranty</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div
                      style={{ color: draftTheme.primaryColor }}
                      className="text-lg font-extrabold"
                    >
                      PCAB #49821
                    </div>
                    <div className="text-[11px] text-neutral-400">Licensed Contractor</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 5: CATEGORIES, HASHTAGS & ACTIVITY LOGS
         ===================================================================== */}
      {activeSubTab === "categories-logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories & Hashtags */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Blog Categories</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    const res = await authFetch("/api/admin/blog/categories", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newCategoryName.trim(), description: newCategoryDesc }),
                    });
                    if (res.ok) {
                      setNewCategoryName("");
                      loadAllCmsData();
                      notify("Category added!", "success");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs cursor-pointer"
                >
                  Add
                </button>
              </div>
              <div className="divide-y divide-neutral-200/60 dark:divide-white/10">
                {categories.map((cat) => (
                  <div key={cat.category_id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold">{cat.name}</span>
                      <span className="ml-2 text-neutral-400">({cat.post_count || 0} posts)</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await authFetch(`/api/admin/blog/categories/${cat.category_id}`, {
                          method: "DELETE",
                        });
                        loadAllCmsData();
                      }}
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="lg:col-span-7">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#10131a] border border-neutral-200 dark:border-white/10 space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider">
                Recent CMS &amp; Admin Activity Logs
              </h3>
              <div className="divide-y divide-neutral-200/60 dark:divide-white/10 max-h-[420px] overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.log_id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {log.action}
                      </span>
                      <span className="ml-2 text-neutral-600 dark:text-neutral-300">
                        by {log.admin_name || log.admin_email || "Administrator"}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                      {new Date(log.created_at).toLocaleString("en-PH")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA PICKER MODAL FOR POST COMPOSER (MULTI-SELECT + DIRECT UPLOAD) */}
      {mediaPickerModalOpen && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-white/10 max-w-4xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-base">
                  {cmsMediaPickerTarget
                    ? `Select Photo or Video for [${cmsMediaPickerTarget.contentKey}]`
                    : "Select Multiple Photos & Videos"}
                </h4>
                <p className="text-xs text-neutral-500">
                  {cmsMediaPickerTarget
                    ? "Click any item from your media library to assign it, or upload a new file from your device."
                    : "Click as many photos and videos as you want, or upload new files directly from your device."}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingMedia ? "Uploading..." : "+ Upload New Files"}</span>
                  <input
                    type="file"
                    multiple={!cmsMediaPickerTarget}
                    accept="image/*,video/*"
                    onChange={async (e) => {
                      if (cmsMediaPickerTarget) {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploadingMedia(true);
                        try {
                          const fd = new FormData();
                          fd.append("files", file);
                          fd.append("category", "website");
                          const r = await authFetch("/api/admin/cms/media/upload", {
                            method: "POST",
                            body: fd,
                          });
                          const d = await r.json();
                          if (r.ok && d.media?.[0]?.file_url) {
                            handleContentFieldChange(
                              cmsMediaPickerTarget.pageKey,
                              cmsMediaPickerTarget.sectionKey,
                              cmsMediaPickerTarget.contentKey,
                              d.media[0].file_url
                            );
                            notify(`Uploaded & assigned to ${cmsMediaPickerTarget.contentKey}! Click Save & Publish Changes to apply live.`, "success");
                            loadAllCmsData();
                            setCmsMediaPickerTarget(null);
                            setMediaPickerModalOpen(false);
                          }
                        } catch (_) {
                          notify("Upload failed.", "error");
                        } finally {
                          setUploadingMedia(false);
                        }
                        return;
                      }
                      handleUploadFilesToPost(e.target.files, true);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerModalOpen(false);
                    setCmsMediaPickerTarget(null);
                  }}
                  className="p-2 rounded-full bg-neutral-100 dark:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 overflow-y-auto flex-1 pr-1">
              {mediaItems.map((m) => {
                const isSelected = selectedLibraryUrls.includes(m.file_url);
                const isVideo =
                  m.file_type?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(m.file_url || "");
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (cmsMediaPickerTarget) {
                        handleContentFieldChange(
                          cmsMediaPickerTarget.pageKey,
                          cmsMediaPickerTarget.sectionKey,
                          cmsMediaPickerTarget.contentKey,
                          m.file_url
                        );
                        setCmsMediaPickerTarget(null);
                        setMediaPickerModalOpen(false);
                        notify(`Assigned to ${cmsMediaPickerTarget.contentKey}! Click Save & Publish Changes to apply.`, "success");
                        return;
                      }
                      setSelectedLibraryUrls((prev) =>
                        prev.includes(m.file_url)
                          ? prev.filter((u) => u !== m.file_url)
                          : [...prev, m.file_url]
                      );
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 group cursor-pointer transition-all ${
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-500/40"
                        : "border-neutral-200 dark:border-white/10 hover:border-amber-500/60"
                    }`}
                  >
                    {isVideo ? (
                      <video src={m.file_url} muted className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.file_url} alt="" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-mono uppercase">
                      {isVideo ? "VIDEO" : "PHOTO"}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center font-extrabold text-xs shadow-md">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">
                {cmsMediaPickerTarget
                  ? "Click any item to select it directly"
                  : `${selectedLibraryUrls.length} file(s) selected`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaPickerModalOpen(false);
                    setCmsMediaPickerTarget(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                {!cmsMediaPickerTarget && (
                  <button
                    type="button"
                    disabled={selectedLibraryUrls.length === 0}
                    onClick={() => {
                      const selectedObjects = selectedLibraryUrls
                        .map((url) => mediaItems.find((item) => item.file_url === url))
                        .filter(Boolean)
                        .map((m) => ({
                          media_type:
                            m.file_type?.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(m.file_url || "")
                              ? "video"
                              : "image",
                          url: m.file_url,
                          caption: m.title || "",
                        }));
                      setPostForm((prev) => ({
                        ...prev,
                        media: [...prev.media, ...selectedObjects],
                      }));
                      setSelectedLibraryUrls([]);
                      setMediaPickerModalOpen(false);
                      notify(`Attached ${selectedObjects.length} file(s) to post!`, "success");
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Attach Selected ({selectedLibraryUrls.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE POST CONFIRMATION DIALOG */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-white/10 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-extrabold text-base">Delete Blog Post?</h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              Are you sure you want to permanently delete{" "}
              <strong>{deleteConfirmPost.title || "this post"}</strong>? This action will immediately remove it from the public website.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPost(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePostConfirmed}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-USE MEDIA DELETION PROTECTION DIALOG */}
      {mediaDeleteWarning && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-amber-500/40 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-extrabold text-base">Media Currently In Use</h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              {mediaDeleteWarning.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMediaDeleteWarning(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/10 text-xs font-bold cursor-pointer"
              >
                Keep Media Safe
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMedia(mediaDeleteWarning.mediaId, true)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
              >
                Force Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
