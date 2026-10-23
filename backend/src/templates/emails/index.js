const { getOtpVerificationTemplate } = require("./otpVerificationTemplate");
const { getWelcomeEmailTemplate } = require("./welcomeEmailTemplate");
const { getInquiryReceiptTemplate } = require("./inquiryReceiptTemplate");
const { getInquiryAdminAlertTemplate } = require("./inquiryAdminAlertTemplate");
const { getInquiryMeetingConfirmationTemplate } = require("./inquiryMeetingConfirmationTemplate");
const { getInquiryRescheduledTemplate } = require("./inquiryRescheduledTemplate");
const { getInquiryRejectedTemplate } = require("./inquiryRejectedTemplate");
const { getInquiryStatusUpdateTemplate } = require("./inquiryStatusUpdateTemplate");
const { getEmailVerificationLinkTemplate } = require("./emailVerificationLinkTemplate");
const { getMeetingAttendanceReminderTemplate } = require("./attendanceReminderTemplate");
const { getAdminInviteLinkTemplate } = require("./adminInviteLinkTemplate");

module.exports = {
  getOtpVerificationTemplate,
  getWelcomeEmailTemplate,
  getInquiryReceiptTemplate,
  getInquiryAdminAlertTemplate,
  getInquiryMeetingConfirmationTemplate,
  getInquiryRescheduledTemplate,
  getInquiryRejectedTemplate,
  getInquiryStatusUpdateTemplate,
  getEmailVerificationLinkTemplate,
  getMeetingAttendanceReminderTemplate,
  getAdminInviteLinkTemplate,
};

