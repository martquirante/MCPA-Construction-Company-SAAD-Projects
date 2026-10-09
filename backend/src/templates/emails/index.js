const { getOtpVerificationTemplate } = require("./otpVerificationTemplate");
const { getWelcomeEmailTemplate } = require("./welcomeEmailTemplate");
const { getInquiryReceiptTemplate } = require("./inquiryReceiptTemplate");
const { getInquiryAdminAlertTemplate } = require("./inquiryAdminAlertTemplate");
const { getInquiryMeetingConfirmationTemplate } = require("./inquiryMeetingConfirmationTemplate");

module.exports = {
  getOtpVerificationTemplate,
  getWelcomeEmailTemplate,
  getInquiryReceiptTemplate,
  getInquiryAdminAlertTemplate,
  getInquiryMeetingConfirmationTemplate,
};
