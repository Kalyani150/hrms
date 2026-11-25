// /api/leaves - the handlers are in controllers/leaveController.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const checkId = require("../middleware/checkId")("leave");
const leaves = require("../controllers/leaveController");

const router = express.Router();

router.use(protect);

router.post("/", leaves.applyLeave);
router.get("/", leaves.listLeaves); // Admin: everyone's, Employee: own
router.patch("/:id/status", authorize("Admin"), checkId, leaves.reviewLeave);
router.delete("/:id", checkId, leaves.cancelLeave); // own pending request

module.exports = router;
