/**
 * MCPA Construction and Supply — Official Chatbot Seed Data
 * 
 * Contains the complete 80 Frequently Asked Questions (FAQs 001 - 080)
 * and 9 official categories, along with deterministic search settings
 * and bilingual localized customer messages.
 */

const { OFFICIAL_CATEGORIES, FAQS_80 } = require("./knowledgeBase80Data");

const DEFAULT_CATEGORIES = OFFICIAL_CATEGORIES;
const DEFAULT_FAQS = FAQS_80;

const DEFAULT_SETTINGS = {
  min_match_threshold: 0.42,
  ambiguity_delta: 0.06,
  max_suggestions: 5,
  debounce_ms: 250,
  messenger_url: "https://www.messenger.com/t/101780969082788",
  social_links: {
    facebook: "https://www.facebook.com/MCPA.ConstructionandSupply/",
    instagram: "https://www.instagram.com/mcpa.constructionandsupply/",
    tiktok: "https://www.tiktok.com/@mcpa.construction",
  },
  messages: {
    en: {
      initial_greeting:
        "Hello! Welcome to MCPA Construction and Supply. I'm here to help answer your questions about our services, projects, and construction inquiries.",
      name_request: "Before we begin, what should I call you?",
      personalized_welcome: "Nice to meet you, {name}! How can I help you today?",
      feedback_prompt: "Did this answer your question?",
      resolved_closing: "Glad I could help, {name}! Thank you for contacting MCPA Construction and Supply.",
      escalation_intro:
        "No problem, {name}. Let me help you connect with the MCPA team so you can get the information you need.",
      unknown_fallback:
        "Sorry, {name}. I couldn't find a reliable answer to that question in our current information. I don't want to give you incorrect details.",
      email_gate_prompt:
        "Before I connect you with an MCPA administrator, please provide your email address so our team can follow up with you.",
      email_gate_placeholder: "yourname@example.com",
      email_gate_submit: "Connect to MCPA Admin",
      human_waiting:
        "Thank you, {name}. Your inquiry and email ({email}) have been received. An authorized MCPA administrator has been notified and will respond as soon as they are available.",
      start_new_conversation: "Start a New Conversation",
      talk_to_real_person: "Talk to a Real Person",
      continue_chatting: "Continue Chatting",
      yes_helps: "Yes, that helps",
      no_more_help: "No, I need more help",
    },
    fil: {
      initial_greeting:
        "Kumusta! Maligayang pagdating sa MCPA Construction and Supply. Narito ako upang sagutin ang iyong mga katanungan tungkol sa aming mga serbisyo, proyekto, at inquiries sa pagpapatayo.",
      name_request: "Bago tayo magsimula, ano ang itatawag ko sa iyo?",
      personalized_welcome: "Ikinagagalak kitang makilala, {name}! Paano kita matutulungan ngayon?",
      feedback_prompt: "Nakatulong ba ang sagot na ito sa iyong katanungan?",
      resolved_closing: "Masaya akong nakatulong, {name}! Maraming salamat sa pagkontak sa MCPA Construction and Supply.",
      escalation_intro:
        "Walang anuman, {name}. Tutulungan kitang kumonekta sa MCPA team upang makuha mo ang eksaktong impormasyong kailangan mo.",
      unknown_fallback:
        "Paumanhin, {name}. Wala akong nahanap na sapat at maaasahang sagot sa kasalukuyan naming impormasyon. Ayaw naming magbigay ng maling detalye.",
      email_gate_prompt:
        "Bago kita ikonekta sa isang MCPA administrator, pakilagay ang iyong email address upang ma-follow up ka ng aming team.",
      email_gate_placeholder: "iyong.email@example.com",
      email_gate_submit: "Kumonekta sa MCPA Admin",
      human_waiting:
        "Salamat, {name}. Natanggap na ang iyong mensahe at email ({email}). Naabisuhan na ang aming MCPA administrator at tutugon sa lalong madaling panahon.",
      start_new_conversation: "Magsimula ng Bagong Usapan",
      talk_to_real_person: "Kausapin ang Tunay na Tao",
      continue_chatting: "Magpatuloy sa Chat",
      yes_helps: "Oo, nakatulong ito",
      no_more_help: "Hindi, kailangan ko pa ng tulong",
    },
  },
};

module.exports = {
  DEFAULT_CATEGORIES,
  DEFAULT_FAQS,
  DEFAULT_SETTINGS,
};
