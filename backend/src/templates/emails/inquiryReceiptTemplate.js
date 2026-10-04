/**
 * MCPA Construction & Supply - Consultation Brief Receipt Email Template
 * Exact copy of the inquiry confirmation UI
 */
function getInquiryReceiptTemplate(brief = {}) {
  const venueText = brief.venue_type
    ? `${brief.venue_type} ${brief.venue_details ? `(${brief.venue_details})` : ""}`
    : (brief.meeting_mode || "Online Meeting");

  return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0e14; color: #f8fafc; padding: 32px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px;">MCPA Construction & Supply</h2>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0; font-family: monospace;">CONSULTATION DOSSIER RECEIPT</p>
        </div>
        <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0;">Dear <strong>${brief.client_name || "Valued Client"}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Your project consultation brief has been successfully lodged in our architectural pipeline. Our Lead Architect and Engineering team are currently reviewing your project scope and lot details.
        </p>

        <div style="background: #141721; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 11px; font-family: monospace; color: #f59e0b; text-transform: uppercase;">Reference Specification</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Submission ID:</strong> <span style="font-family: monospace; color: #38bdf8;">${brief.submission_id || "N/A"}</span></p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Project Type:</strong> ${brief.project_type || "Residential"}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Lot Location:</strong> ${brief.location || "Bulacan"} ${brief.map_coordinates ? `(${brief.map_coordinates})` : ""}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Target Budget:</strong> ${brief.budget_range || "Flexible"}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Consultation Preference:</strong> ${venueText}</p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #f59e0b; font-style: italic;">*All consultation schedules are subject to Lead Architect field confirmation within 24 hours.</p>
        </div>

        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
          You can track the live review status, review blueprints, or access milestone site progress in your <strong>Client Portal</strong> at any time.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; margin-top: 24px; font-size: 11px; color: #64748b;">
          MCPA Construction & Supply • Plaridel, Bulacan • support@mcpa.com
        </div>
      </div>
    `;
}

module.exports = {
  getInquiryReceiptTemplate,
};
