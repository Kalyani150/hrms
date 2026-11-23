// Shared validation rules for every backend route.
// (The frontend has the same rules in frontend/src/utils/validation.js - keep them in sync.)
const { z } = require("zod");

const NAME_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*_\-])[A-Za-z0-9!@#$%&*_-]{8,128}$/;

const MESSAGES = {
  name: "Name should contain only letters",
  nameLength: "Name must be 2 to 50 characters",
  email: "Enter a valid email (e.g. name@gmail.com)",
  phone: "Phone number must be 10 digits",
  password: "Password must be 8-128 characters with uppercase, lowercase, number and one of these symbols: ! @ # $ % & * _ -"
};

// Full name: letters and single spaces only, 2-50 characters, trimmed
const nameSchema = z
  .string()
  .trim()
  .min(2, MESSAGES.nameLength)
  .max(50, MESSAGES.nameLength)
  .regex(NAME_REGEX, MESSAGES.name);

// Email: validated, then stored in lowercase
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, MESSAGES.email)
  .regex(EMAIL_REGEX, MESSAGES.email);

// Phone is optional: empty is allowed, otherwise exactly 10 digits
const phoneSchema = z.string().trim().regex(/^$|^\d{10}$/, MESSAGES.phone);

// Password: 8+ characters with upper, lower, number and special character
const passwordSchema = z.string().regex(PASSWORD_REGEX, MESSAGES.password);

// Money amounts (salary, bonus, deductions): 0 to 1 crore, at most 2 decimals
const MAX_AMOUNT = 10000000;
const amountSchema = (label) =>
  z.coerce
    .number(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .max(MAX_AMOUNT, `${label} cannot be more than ${MAX_AMOUNT.toLocaleString("en-IN")}`)
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, `${label} can have at most 2 decimal places`);

// Department / designation: 2-50 characters, letters only (plus spaces and / & - .), no numbers
const TEXT_REGEX = /^[A-Za-z][A-Za-z /&.-]*$/;

const textSchema = (label) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be 2 to 50 characters`)
    .max(50, `${label} must be 2 to 50 characters`)
    .regex(TEXT_REGEX, `${label} should contain only letters`);

module.exports = {
  NAME_REGEX,
  EMAIL_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX,
  TEXT_REGEX,
  MESSAGES,
  nameSchema,
  emailSchema,
  phoneSchema,
  passwordSchema,
  textSchema,
  amountSchema,
  MAX_AMOUNT
};
