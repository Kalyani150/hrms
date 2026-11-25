// /api/attendance - the handlers are in controllers/attendanceController.js
const express = require("express");
const { protect } = require("../middleware/auth");
const attendance = require("../controllers/attendanceController");

const router = express.Router();

router.use(protect);

router.post("/check-in", attendance.checkIn);
router.post("/check-out", attendance.checkOut);
router.get("/today", attendance.getToday);
router.get("/my", attendance.getMyAttendance);
router.get("/", attendance.listAttendance); // Admin: everyone's, Employee: own

module.exports = router;
