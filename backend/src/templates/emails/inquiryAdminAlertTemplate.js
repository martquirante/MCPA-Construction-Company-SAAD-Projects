/**
 * MCPA Construction & Supply - Admin Alert Email Template
 * Exact copy of the new inquiry alert UI
 */
function getInquiryAdminAlertTemplate(brief = {}) {
  const adminUrl = process.env.ADMIN_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/admin` : "https://mcpa-construction.vercel.app/admin");

  return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0c0e14; color: #f8fafc; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #f59e0b; border-radius: 8px;">
        <h3 style="color: #f59e0b; margin: 0 0 12px 0;">New Consultation Brief Lodged</h3>
        <p style="font-size: 14px;"><strong>Client:</strong> ${brief.client_name} (${brief.client_email})</p>
        <p style="font-size: 14px;"><strong>Contact:</strong> ${brief.client_phone || "Not specified"}</p>
        <p style="font-size: 14px;"><strong>Scope:</strong> ${brief.project_type || "Residential"} • Style: ${brief.preferred_style || "Custom"}</p>
        <p style="font-size: 14px;"><strong>Lot:</strong> ${brief.location || "Bulacan"} (${brief.lot_area || "N/A"}) • Pinned: ${brief.map_coordinates || "None"}</p>
        <p style="font-size: 14px;"><strong>Meeting Request:</strong> ${brief.venue_type || brief.meeting_mode || "Online"} - ${brief.venue_details || ""}</p>
        <p style="font-size: 14px;"><strong>Target Start:</strong> ${brief.target_date || "Flexible"}</p>
        <p style="margin-top: 16px;"><a href="${adminUrl}" style="background: #f59e0b; color: #000; padding: 10px 16px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">Open Admin Inquiries Pipeline →</a></p>
      </div>
    `;
}

module.exports = {
  getInquiryAdminAlertTemplate,
};
