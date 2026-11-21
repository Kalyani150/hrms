// Creates the first admin account from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD.
//   - `npm run seed`          : creates the admin if that email does not exist yet
//   - server start (server.js): creates it only when the database has NO admin at all,
//                               so a fresh deployment gets its first login automatically
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const { emailSchema, passwordSchema, nameSchema } = require("../utils/validation");

const check = (schema, value, label) => {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(`${label}: ${result.error.issues[0].message}`);
};

async function ensureAdmin({ onlyIfNoAdmin = false } = {}) {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return { created: false, reason: "ADMIN_EMAIL / ADMIN_PASSWORD are not set" };
  }
  if (onlyIfNoAdmin && (await User.exists({ role: "Admin" }))) {
    return { created: false, reason: "an admin already exists" };
  }

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });
  if (existing) {
    return { created: false, reason: `${email} already exists (role: ${existing.role})` };
  }

  // New accounts must follow the same rules as everywhere else in the app
  check(emailSchema, ADMIN_EMAIL, "ADMIN_EMAIL");
  check(passwordSchema, ADMIN_PASSWORD, "ADMIN_PASSWORD");
  check(nameSchema, ADMIN_NAME || "HR Administrator", "ADMIN_NAME");

  await User.create({
    name: ADMIN_NAME || "HR Administrator",
    email,
    password: ADMIN_PASSWORD, // hashed by the pre-save hook
    role: "Admin",
    department: "Human Resources",
    designation: "HR Administrator"
  });
  return { created: true, email };
}

module.exports = { ensureAdmin };

// `npm run seed`
if (require.main === module) {
  (async () => {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be set in .env");
    await mongoose.connect(process.env.MONGO_URI);
    const result = await ensureAdmin();
    console.log(result.created ? `Admin created: ${result.email}` : `Nothing changed: ${result.reason}.`);
  })()
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
