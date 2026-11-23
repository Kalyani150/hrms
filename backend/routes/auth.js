const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { nameSchema, emailSchema, phoneSchema, passwordSchema } = require("../utils/validation");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

const loginSchema = z.object({
  email: emailSchema,
  // sign-in only needs a value; complexity rules apply when a password is created/changed
  password: z.string().min(1, "Password is required")
});

// Public sign-up creates a Pending Employee that an admin must approve before it can sign in.
// Admins are created by the seed script.
const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

const forgotSchema = z.object({ email: emailSchema });

const resetSchema = z.object({
  token: z.string().min(1, "Reset link is invalid"),
  password: passwordSchema
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema
});

// Fields an employee may change about themselves (email, role, salary etc. are admin-managed)
const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: z.string().trim().max(300, "Address must be at most 300 characters")
}).partial();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  designation: u.designation,
  phone: u.phone,
  address: u.address,
  salary: u.salary,
  joiningDate: u.joiningDate,
  status: u.status
});

const RESET_MINUTES = 15;
const hashToken = (t) => crypto.createHash("sha256").update(t).digest("hex");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  if (await User.exists({ email: parsed.data.email })) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  await User.create({ ...parsed.data, role: "Employee", status: "Pending" });
  res.status(201).json({
    message: "Registration received. An administrator must approve your account before you can sign in."
  });
});

// POST /api/auth/forgot-password
// Always answers the same way so the form cannot be used to find out which emails are registered.
router.post("/forgot-password", async (req, res) => {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const response = { message: "If that email is registered, a reset link has been sent." };
  const user = await User.findOne({ email: parsed.data.email, status: "Active" });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetTokenHash = hashToken(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_MINUTES * 60 * 1000);
    await user.save();

    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;
    const sent = await sendMail({
      to: user.email,
      subject: "Reset your HRMS password",
      text: `Use this link to choose a new password (valid for ${RESET_MINUTES} minutes):\n\n${link}\n\nIf you did not ask for this, ignore this email.`
    });

    // Without SMTP settings (local development only) the link is returned so the flow can be tried
    if (!sent && process.env.NODE_ENV !== "production") response.devResetLink = link;
  }

  res.json(response);
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const user = await User.findOne({
    resetTokenHash: hashToken(parsed.data.token),
    resetTokenExpires: { $gt: new Date() }
  }).select("+resetTokenHash +resetTokenExpires");

  if (!user) {
    return res.status(400).json({ message: "This reset link is invalid or has expired" });
  }

  user.password = parsed.data.password; // hashed by the pre-save hook
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ message: "Password updated. You can now sign in." });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).select("+password");

  // Same message for unknown email and wrong password
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.status === "Pending") {
    return res.status(403).json({ message: "Your account is awaiting administrator approval" });
  }
  if (user.status !== "Active") {
    return res.status(403).json({ message: "Your account is inactive" });
  }

  res.cookie("token", signToken(user), cookieOptions);
  res.json({ user: publicUser(user) });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", { ...cookieOptions, maxAge: undefined });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/profile   (update my own name, phone, address)
router.put("/profile", protect, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  req.user.set(parsed.data);
  await req.user.save();
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(parsed.data.currentPassword))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return res.status(400).json({ message: "New password must be different from the current password" });
  }

  user.password = parsed.data.newPassword; // hashed by the pre-save hook
  await user.save();
  res.json({ message: "Password updated" });
});

module.exports = router;
