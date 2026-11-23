const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { emailSchema, passwordSchema, nameSchema } = require("../utils/validation");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true, select: false },
  // Password reset: only a hash of the emailed token is stored
  resetTokenHash: { type: String, select: false },
  resetTokenExpires: { type: Date, select: false },
  role: {
    type: String,
    enum: ["Admin", "Employee"],
    default: "Employee"
  },
  department: { type: String, default: "" },
  designation: { type: String, default: "" },
  phone: { type: String, default: "", trim: true },
  address: { type: String, default: "", trim: true },
  salary: { type: Number, default: 0, min: 0 },
  joiningDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  }
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Creates the first admin from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD.
// db.js calls this with onlyIfNoAdmin on startup, so a fresh database gets its first login automatically.
userSchema.statics.ensureAdmin = async function ({ onlyIfNoAdmin = false } = {}) {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return { created: false, reason: "ADMIN_EMAIL / ADMIN_PASSWORD are not set" };
  }
  if (onlyIfNoAdmin && (await this.exists({ role: "Admin" }))) {
    return { created: false, reason: "an admin already exists" };
  }

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await this.findOne({ email });
  if (existing) {
    return { created: false, reason: `${email} already exists (role: ${existing.role})` };
  }

  // New accounts must follow the same rules as everywhere else in the app
  const name = ADMIN_NAME || "HR Administrator";
  for (const [schema, value, label] of [
    [emailSchema, ADMIN_EMAIL, "ADMIN_EMAIL"],
    [passwordSchema, ADMIN_PASSWORD, "ADMIN_PASSWORD"],
    [nameSchema, name, "ADMIN_NAME"]
  ]) {
    const result = schema.safeParse(value);
    if (!result.success) throw new Error(`${label}: ${result.error.issues[0].message}`);
  }

  await this.create({
    name,
    email,
    password: ADMIN_PASSWORD, // hashed by the pre-save hook
    role: "Admin",
    department: "Human Resources",
    designation: "HR Administrator"
  });
  return { created: true, email };
};

module.exports = mongoose.model("User", userSchema);
