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

  const project = activeProject || dashboardState?.activeProject;
  const isProjectCompleted = Boolean(
    dashboardState?.stage_id === "COMPLETED" ||
    project?.stage_id === "COMPLETED" ||
    Number(project?.progress_pct || 0) >= 100 ||
    Number(project?.site_progress_pct || 0) >= 100 ||
    (project?.status || "").toLowerCase().includes("complete") ||
    (project?.status || "").toLowerCase().includes("handover") ||
    (project?.status || "").toLowerCase().includes("turnover") ||
    (project?.current_phase || "").toLowerCase().includes("turnover") ||
    (project?.current_phase || "").toLowerCase().includes("handover")
  );

  // Check 1: Active project in dashboardState
  // Completed / 100% finished projects do NOT block clients from starting a new build!
  if (project && !isProjectCompleted && !project.is_archived) {
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
  // If client has finished their house (Stage 4 / Completed / 100%), any past brief associated
  // with that finished project must NOT block them from booking their next build!
  if (Array.isArray(inquiries) && inquiries.length > 0) {
    const activeBrief = inquiries.find((inq) => {
      if (!isBriefActive(inq.status)) return false;

      // If client has reached Stage 4 / Completed, previous briefs for that project do not block
      if (isProjectCompleted) {
        if (
          inq.brief_id === project?.brief_id ||
          inq.client_project_id === project?.client_project_id ||
          inq.submission_id === project?.brief_submission_id
        ) {
          return false;
        }
        if ((inq.current_stage_status || inq.stage_id || "").toUpperCase() === "COMPLETED") {
          return false;
        }
        if (project?.created_at && inq.created_at) {
          const inqTime = new Date(inq.created_at).getTime();
          const projTime = new Date(project.created_at).getTime();
          if (inqTime <= projTime + 60000) {
            return false;
          }
        }
      }

      return true;
    });

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
