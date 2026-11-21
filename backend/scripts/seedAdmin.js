require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const { emailSchema, passwordSchema, nameSchema } = require("../utils/validation");

const run = async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }
  await mongoose.connect(MONGO_URI);

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`User ${email} already exists (role: ${existing.role}). Nothing changed.`);
  } else {
    // New accounts must follow the same rules as everywhere else in the app
    const check = (schema, value, label) => {
      const result = schema.safeParse(value);
      if (!result.success) throw new Error(`${label}: ${result.error.issues[0].message}`);
    };
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
    console.log(`Admin created: ${email}`);
  }
};

run()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
