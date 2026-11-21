// Shared validation rules for every backend route.
// (The frontend has the same rules in frontend/src/utils/validation.js - keep them in sync.)
const { z } = require("zod");

const NAME_REGEX = /^[A-Za-z]+( [A-Za-z]+)*$/;
const EMAIL_REGEX = /^[a-zA-Z0-9]+([._-]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/;
const PHONE_REGEX = /^\d{10}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const MESSAGES = {
  name: "Name should contain only letters",
  nameLength: "Name must be 2 to 50 characters",
  email: "Enter a valid email (e.g. name@gmail.com)",
  phone: "Phone number must be 10 digits",
  password: "Password must be 8+ characters with uppercase, lowercase, number and symbol"
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
const passwordSchema = z.string().max(128, MESSAGES.password).regex(PASSWORD_REGEX, MESSAGES.password);

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
  textSchema
};
