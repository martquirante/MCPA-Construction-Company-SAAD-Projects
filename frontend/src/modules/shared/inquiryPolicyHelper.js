/**
 * MCPA Construction & Supply — Inquiry Policy Gatekeeper Helper
 * Enforces the Single Active Project / Single Active Inquiry policy.
 */

import { authFetch } from "./authFetch";

/**
 * Checks if a brief status is considered active (i.e. not concluded or rejected)
 */
export function isBriefActive(status) {
  if (!status) return true;
  const s = status.toLowerCase();
  if (
    s.includes("reject") ||
    s.includes("decline") ||
    s.includes("discontinue") ||
    s.includes("withdrawn") ||
    s.includes("completed") ||
    s.includes("archived")
  ) {
    return false;
  }
  return true;
}

/**
 * Checks if client is blocked from starting a new inquiry based on in-memory states
 */
export function evaluateSingleInquiryPolicy({
  inquiries = [],
  dashboardState = null,
  activeProject = null,
}) {
  // If user is explicitly multi-project approved by administration, they are not blocked
  if (dashboardState?.is_multi_project_approved) {
    return { isBlocked: false, activeInquiry: null };
  }

  // Check 1: Active project in dashboardState
  const project = activeProject || dashboardState?.activeProject;
  if (project && project.stage_id !== "COMPLETED" && !project.is_archived) {
    return {
      isBlocked: true,
      activeInquiry: {
        submissionId: project.project_code || "PRJ-ACTIVE",
        projectType: project.project_title || project.project_type || "Residential Build",
        status: project.stage_id ? `Stage: ${project.stage_id}` : "Active Construction",
        location: project.target_location || "Bulacan / NCR",
        createdAt: project.created_at,
        isProject: true,
      },
    };
  }

  // Check 2: Active brief in inquiries list
  if (Array.isArray(inquiries) && inquiries.length > 0) {
    const activeBrief = inquiries.find((inq) => isBriefActive(inq.status));
    if (activeBrief) {
      return {
        isBlocked: true,
        activeInquiry: {
          briefId: activeBrief.brief_id,
          submissionId: activeBrief.submission_id || activeBrief.submissionId || "MCPA-CPB-ACTIVE",
          projectType: activeBrief.project_type || activeBrief.projectType || "Residential Design & Build",
          status: activeBrief.status || "Pending Review",
          location: activeBrief.location || "Bulacan",
          createdAt: activeBrief.created_at || activeBrief.createdAt,
          isProject: false,
        },
      };
    }
  }

  return { isBlocked: false, activeInquiry: null };
}

/**
 * Asynchronously checks backend if an email address already has an active inquiry
 */
export async function verifyClientActiveInquiry(email, userId = null) {
  if (!email && !userId) return { hasActiveInquiry: false };
  try {
    const params = new URLSearchParams();
    if (email && email.trim()) params.append("email", email.trim().toLowerCase());
    if (userId) params.append("userId", String(userId));
    const res = await authFetch(`/api/client/active-inquiry-check?${params.toString()}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("[inquiryPolicyHelper] Inquiry check error:", err);
    return { hasActiveInquiry: false };
  }
}
