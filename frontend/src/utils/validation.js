// Shared validation rules for every form in the app.
// (The backend enforces the same rules in backend/utils/validation.js - keep them in sync.)

export const NAME_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
export const PHONE_REGEX = /^\d{10}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-])[A-Za-z0-9!@#$%&*_-]{8,128}$/;

export const MESSAGES = {
  name: "Name should contain only letters",
  nameLength: "Name must be 2 to 50 characters",
  email: "Enter a valid email (e.g. name@gmail.com)",
  phone: "Phone number must be 10 digits",
  password: "Password must be 8-128 characters with uppercase, lowercase, number and one of these symbols: ! @ # $ % & * _ -"
};

/* ---------- keystroke filters (also used to clean pasted text) ---------- */
export const ALLOW_NAME_KEY = /[A-Za-z ]/;
export const ALLOW_PHONE_KEY = /\d/;
// Department / designation: letters and spaces, plus / & - . (e.g. "UI/UX Designer"), no numbers
export const TEXT_REGEX = /^[A-Za-z][A-Za-z /&.-]*$/;
export const ALLOW_TEXT_KEY = /[A-Za-z /&.-]/;
// Email: letters, numbers, @ and only the symbols . _ -  (no spaces or other symbols)
export const ALLOW_EMAIL_KEY = /[A-Za-z0-9@._-]/;

// Passwords may only contain letters, numbers and these symbols
export const PASSWORD_SYMBOLS = "! @ # $ % & * _ -";
export const ALLOW_PASSWORD_KEY = /[A-Za-z0-9!@#$%&*_\-]/;
export const sanitizePassword = (v) => v.replace(/[^A-Za-z0-9!@#$%&*_\-]/g, "").slice(0, 128);

export const EMAIL_RULES_HINT =
  "Letters, numbers and . _ - before the @, then a domain like gmail.com or company.co.in. No spaces.";

export const sanitizeName = (v) =>
  v.replace(/[^A-Za-z ]/g, "").replace(/^ +/, "").replace(/ {2,}/g, " ").slice(0, 50);

export const sanitizePhone = (v) => v.replace(/\D/g, "").slice(0, 10);

export const sanitizeText = (v) =>
  v.replace(/[^A-Za-z /&.-]/g, "").replace(/^[ /&.-]+/, "").replace(/ {2,}/g, " ").slice(0, 50);

// Strips anything an email can't contain (spaces, #, +, !, ...) and lowercases it
export const sanitizeEmail = (v) => v.replace(/[^A-Za-z0-9@._-]/g, "").toLowerCase().slice(0, 254);

// Turns saved values such as "+91 98765 43210" into the 10 digits the form expects
export function normalizePhone(v = "") {
  let digits = String(v).replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(-10);
  return digits.slice(0, 10);
}

/* ---------- validators: return an error message, or "" when valid ---------- */
export function validateName(value = "") {
  const t = value.trim();
  if (t.length < 2 || t.length > 50) return MESSAGES.nameLength;
  return NAME_REGEX.test(t) ? "" : MESSAGES.name;
}

export function validateEmail(value = "") {
  const t = value.trim().toLowerCase();
  return EMAIL_REGEX.test(t) ? "" : MESSAGES.email;
}

// Phone is optional unless { required: true }
export function validatePhone(value = "", { required = false } = {}) {
  if (!value) return required ? MESSAGES.phone : "";
  return PHONE_REGEX.test(value) ? "" : MESSAGES.phone;
}

export const validatePassword = (value = "") =>
  PASSWORD_REGEX.test(value) ? "" : MESSAGES.password;

export const validateRequired = (value = "", label = "This field") =>
  String(value).trim() ? "" : `${label} is required`;

// Department / designation: 2-50 characters, letters only (plus spaces and / & - .)
export function validateText(value = "", label = "This field") {
  const t = value.trim();
  if (t.length < 2 || t.length > 50) return `${label} must be 2 to 50 characters`;
  return TEXT_REGEX.test(t) ? "" : `${label} should contain only letters`;
}

export const MAX_AMOUNT = 10000000;

// Money amount: required, a number, 0 to 1 crore, at most 2 decimals
export function validateAmount(value, label = "Amount") {
  if (value === "" || value === null || value === undefined) return `${label} is required`;
  const n = Number(value);
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (n < 0) return `${label} cannot be negative`;
  if (n > MAX_AMOUNT) return `${label} cannot be more than ${MAX_AMOUNT.toLocaleString("en-IN")}`;
  return /^\d+(\.\d{1,2})?$/.test(String(value).trim()) ? "" : `${label} can have at most 2 decimal places`;
}

export const validateSalary = (value) => validateAmount(value, "Salary");

// Deductions cannot be more than basic + bonus
export function validateDeductions(basic, bonus, deductions) {
  const base = validateAmount(deductions, "Deductions");
  if (base) return base;
  return Number(deductions) > Number(basic || 0) + Number(bonus || 0)
    ? "Deductions cannot be more than basic pay plus bonus" : "";
}

export const validateSelect = (value, label = "an option") =>
  value ? "" : `Please select ${label}`;

export const validateMonth = (value = "") =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? "" : "Select a valid month";

// New password must pass the rules and differ from the current one
export function validateNewPassword(value = "", current = "") {
  const rules = validatePassword(value);
  if (rules) return rules;
  return current && value === current ? "New password must be different from the current password" : "";
}

export function validateDate(value = "", label = "Date") {
  if (!value) return `${label} is required`;
  return Number.isNaN(new Date(value).getTime()) ? `${label} is not a valid date` : "";
}

export const validateAddress = (value = "") =>
  value.trim().length <= 300 ? "" : "Address must be at most 300 characters";

// Leave reason: letters, numbers, spaces and . , ! ? ' - / & ( ) :  (no other keys)
export const REASON_REGEX = /^[A-Za-z0-9 .,!?'\-/&():]+$/;
export const ALLOW_REASON_KEY = /[A-Za-z0-9 .,!?'\-/&():]/;
export const sanitizeReason = (v) =>
  v.replace(/[^A-Za-z0-9 .,!?'\-/&():]/g, "").replace(/^ +/, "").replace(/ {2,}/g, " ").slice(0, 500);

export function validateReason(value = "") {
  const t = value.trim();
  if (t.length < 10) return "Reason must be at least 10 characters";
  if (t.length > 500) return "Reason must be at most 500 characters";
  if (!REASON_REGEX.test(t)) return "Reason can only contain letters, numbers, spaces and . , ! ? ' - / & ( ) :";
  return /[A-Za-z]/.test(t) ? "" : "Reason must contain some letters";
}

export function validateEndDate(start, end) {
  const required = validateDate(end, "End date");
  if (required) return required;
  return start && end < start ? "End date cannot be before start date" : "";
}

export const validateConfirm = (password = "", confirm = "") =>
  confirm && confirm === password ? "" : "Passwords do not match";

// true when every error in the object is empty
export const isValid = (errors) => Object.values(errors).every((e) => !e);
