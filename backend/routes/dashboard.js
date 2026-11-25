// /api/dashboard - the handler is in controllers/dashboardController.js
const express = require("express");
const { protect } = require("../middleware/auth");
const dashboard = require("../controllers/dashboardController");

const router = express.Router();

router.get("/", protect, dashboard.getDashboard);

module.exports = router;
