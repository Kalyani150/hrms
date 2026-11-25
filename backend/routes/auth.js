// /api/auth - the handlers are in controllers/authController.js
const express = require("express");
const { protect } = require("../middleware/auth");
const auth = require("../controllers/authController");

const router = express.Router();

// Public
router.post("/register", auth.register);
router.post("/forgot-password", auth.forgotPassword);
router.post("/reset-password", auth.resetPassword);
router.post("/login", auth.login);
router.post("/logout", auth.logout);

// Signed-in users
router.get("/me", protect, auth.getMe);
router.put("/profile", protect, auth.updateProfile);
router.put("/change-password", protect, auth.changePassword);

module.exports = router;
