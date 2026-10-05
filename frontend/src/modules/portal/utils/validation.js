// Comprehensive Frontend Validation & Formatting Utilities for MCPA Client Registration

/**
 * Formats a Philippine mobile number into standard readable spacing: "XXX XXX XXXX"
 * Example: "9123456789" -> "912 345 6789"
 * Strips all non-digit characters and leading zeroes.
 */
export function formatPhPhone(value) {
  if (!value) return "";
  let digits = String(value).replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  digits = digits.slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/**
 * Formats an international contact number cleanly with spaces every 3 to 4 digits.
 * Strips all non-digit characters.
 */
export function formatIntlPhone(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "").slice(0, 15);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
}

/**
 * Validates a Philippine mobile number:
 * Must be exactly 10 digits starting with 9 (e.g. 917 123 4567).
 */
export function isValidPhPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 && digits.startsWith("9");
}

/**
 * Validates a human name:
 * Allows letters (including accented characters), spaces, hyphens, and periods (e.g. "Ma. Cristina", "Jose-Mari").
 * Rejects numbers, keyboard spam, or symbols.
 */
export function isValidName(name) {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  // Disallow numbers or special characters except hyphens, spaces, and periods
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-.]+$/;
  return nameRegex.test(trimmed);
}

/**
 * Strict, realistic email validator:
 * Checks RFC compliance, ensures a valid domain and TLD,
 * and detects obvious fake / placeholder emails.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();

  // Basic RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) return false;

  // Split into user and domain
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;

  // Domain must contain a period and at least 2 chars TLD
  const domainParts = domain.split(".");
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) return false;

  // Detect obvious fake / invented emails
  const fakePatterns = [
    "test@test.com",
    "asdf@asdf.com",
    "abc@abc.com",
    "123@123.com",
    "admin@admin.com",
    "example@example.com",
    "fake@fake.com",
    "aaa@aaa.com",
    "email@email.com",
  ];
  if (fakePatterns.includes(trimmed)) return false;

  // Detect repeating identical local part and domain (e.g. "qwerty@qwerty.com")
  if (domainParts[0] === localPart && domainParts[0].length <= 5) return false;

  return true;
}

/**
 * Password strength evaluator:
 * Returns score, labels, interactive criteria flags, and explicit missing items.
 */
export function evaluatePassword(password, lang = "en") {
  const pwd = String(password || "");
  const minLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);
  const hasLetter = hasUpper || hasLower;

  const isFil = lang === "fil";

  // Individual interactive criteria checkpoints
  const criteria = [
    {
      id: "length",
      met: minLength,
      label: "8+ characters",
      labelFil: "8+ karakter",
    },
    {
      id: "letter",
      met: hasLetter,
      label: "Letters (A-Z / a-z)",
      labelFil: "Mga titik (A-Z / a-z)",
    },
    {
      id: "number",
      met: hasNumber,
      label: "At least 1 number (0-9)",
      labelFil: "May numero (0-9)",
    },
    {
      id: "symbol",
      met: hasSpecial,
      label: "Special symbol (!@#$...)",
      labelFil: "Simbolo (!@#$...)",
    },
  ];

  const metCount = criteria.filter((c) => c.met).length;
  // Strictly require length, letters, number, and special symbol
  const isValid = minLength && hasLetter && hasNumber && hasSpecial;

  // Missing criteria list for explicit error feedback to the user
  const missing = [];
  if (!minLength) missing.push(isFil ? "8+ karakter" : "8+ characters");
  if (!hasLetter) missing.push(isFil ? "titik (A-Z/a-z)" : "letters (A-Z/a-z)");
  if (!hasNumber) missing.push(isFil ? "numero (0-9)" : "number (0-9)");
  if (!hasSpecial) missing.push(isFil ? "simbolo (!@#$)" : "symbol (!@#$)");

  let label = isFil ? "Masyadong Mahina" : "Very Weak";
  let color = "text-red-500";
  let bg = "bg-red-500";
  let score = 0;

  if (isValid) {
    score = 4;
    if (pwd.length >= 12 && hasUpper && hasLower) {
      label = isFil ? "Napakalakas" : "Very Strong";
      color = "text-emerald-500";
      bg = "bg-emerald-500";
    } else {
      label = isFil ? "Malakas" : "Strong";
      color = "text-emerald-500";
      bg = "bg-emerald-500";
    }
  } else if (metCount >= 3) {
    score = 3;
    label = isFil ? "Katamtaman" : "Fair";
    color = "text-amber-500";
    bg = "bg-amber-500";
  } else if (metCount >= 2) {
    score = 2;
    label = isFil ? "Mahina" : "Weak";
    color = "text-orange-500";
    bg = "bg-orange-500";
  } else if (pwd.length > 0) {
    score = 1;
    label = isFil ? "Masyadong Mahina" : "Very Weak";
    color = "text-red-500";
    bg = "bg-red-500";
  }

  return {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    hasLetter,
    criteria,
    missing,
    metCount,
    score,
    label,
    color,
    bg,
    isValid,
  };
}

/**
 * Calculates exact age in years from birthdate YYYY-MM-DD
 */
export function calculateAge(birthDateString) {
  if (!birthDateString) return null;
  const birth = new Date(birthDateString);
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validates birthdate for legal age (18 to 95)
 */
export function isValidAge(birthDateString) {
  const age = calculateAge(birthDateString);
  if (age === null) return false;
  return age >= 18 && age <= 95;
}

/**
 * Validates an occupation / profession title (letters and standard separators only)
 */
export function isValidOccupation(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length < 3) return false;
  const occRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\/\&.,]+$/;
  return occRegex.test(trimmed);
}
