const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");

// Same timezone as the dashboard so "today" matches everywhere
const TIME_ZONE = "Asia/Kolkata";

const dateKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d); // YYYY-MM-DD

// Check-ins after this time (HH:MM in TIME_ZONE) are marked Late
const LATE_AFTER = process.env.LATE_AFTER || "09:30";
const isLate = (d) => {
  const [h, m] = LATE_AFTER.split(":").map(Number);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return get("hour") * 60 + get("minute") > h * 60 + m;
};

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const dayRegex = /^\d{4}-\d{2}-\d{2}$/;

// POST /api/attendance/check-in
async function checkIn(req, res, next) {
  const now = new Date();
  try {
    const record = await Attendance.create({
      employee: req.user._id,
      date: dateKey(now),
      checkIn: now,
      status: isLate(now) ? "Late" : "Present"
    });
    res.status(201).json({ attendance: record });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already checked in today" });
    }
    next(err);
  }
}

// POST /api/attendance/check-out
async function checkOut(req, res) {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: dateKey()
  });
  if (!record) {
    return res.status(400).json({ message: "You have not checked in today" });
  }
  if (record.checkOut) {
    return res.status(409).json({ message: "You have already checked out today" });
  }
  record.checkOut = new Date();
  await record.save();
  res.json({ attendance: record });
}

// GET /api/attendance/today   (my record for today, or null)
async function getToday(req, res) {
  const record = await Attendance.findOne({
    employee: req.user._id,
    date: dateKey()
  });
  res.json({ attendance: record });
}

// GET /api/attendance/my?month=YYYY-MM
async function getMyAttendance(req, res) {
  const filter = { employee: req.user._id };
  if (monthRegex.test(req.query.month)) {
    filter.date = { $regex: `^${req.query.month}-` };
  }
  const records = await Attendance.find(filter).sort({ date: -1 }).limit(366);
  res.json({ attendance: records });
}

// GET /api/attendance?date=YYYY-MM-DD&month=YYYY-MM&employee=<id>
// Admin: everyone's records. Employee: only their own.
async function listAttendance(req, res) {
  const filter = {};
  if (dayRegex.test(req.query.date)) {
    filter.date = req.query.date;
  } else if (monthRegex.test(req.query.month)) {
    filter.date = { $regex: `^${req.query.month}-` };
  }
  if (req.user.role !== "Admin") {
    filter.employee = req.user._id;
  } else if (mongoose.isValidObjectId(req.query.employee)) {
    filter.employee = req.query.employee;
  }

  const records = await Attendance.find(filter)
    .populate("employee", "name email department designation")
    .sort({ date: -1, checkIn: -1 })
    .limit(500);
  res.json(records);
}

module.exports = {
  checkIn,
  checkOut,
  getToday,
  getMyAttendance,
  listAttendance
};
