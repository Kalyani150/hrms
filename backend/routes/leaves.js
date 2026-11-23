const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const Leave = require("../models/Leave");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

const applySchema = z.object({
  type: z.enum(["Sick Leave", "Casual Leave", "Annual Leave", "Other"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters")
    .regex(/^[A-Za-z0-9 .,!?'\-/&():]+$/, "Reason can only contain letters, numbers, spaces and . , ! ? ' - / & ( ) :")
    .regex(/[A-Za-z]/, "Reason must contain some letters")
}).refine((d) => d.endDate >= d.startDate, {
  message: "End date cannot be before start date",
  path: ["endDate"]
});

const reviewSchema = z.object({
  status: z.enum(["Approved", "Rejected"])
});

const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid leave id" });
  }
  next();
};

// POST /api/leaves   (apply for leave)
router.post("/", async (req, res) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { startDate, endDate } = parsed.data;

  const overlap = await Leave.findOne({
    employee: req.user._id,
    status: { $in: ["Pending", "Approved"] },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });
  if (overlap) {
    return res.status(409).json({
      message: "You already have a pending or approved leave in this period"
    });
  }

  const leave = await Leave.create({ ...parsed.data, employee: req.user._id });
  res.status(201).json(leave);
});

// GET /api/leaves?status=Pending   (Admin: everyone's leaves, Employee: only their own)
router.get("/", async (req, res) => {
  const filter = {};
  if (req.user.role !== "Admin") filter.employee = req.user._id;
  if (["Pending", "Approved", "Rejected"].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  const leaves = await Leave.find(filter)
    .populate("employee", "name email department")
    .populate("reviewedBy", "name")
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(leaves);
});

// PATCH /api/leaves/:id/status   (Admin approves or rejects a pending leave)
router.patch("/:id/status", authorize("Admin"), checkId, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Status must be Approved or Rejected" });
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  if (leave.employee.equals(req.user._id)) {
    return res.status(403).json({ message: "You cannot review your own leave request" });
  }
  if (leave.status !== "Pending") {
    return res.status(409).json({ message: `Leave was already ${leave.status.toLowerCase()}` });
  }

  leave.status = parsed.data.status;
  leave.reviewedBy = req.user._id;
  leave.reviewedAt = new Date();
  await leave.save();
  res.json({ leave });
});

// DELETE /api/leaves/:id   (cancel my own pending leave)
router.delete("/:id", checkId, async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave || !leave.employee.equals(req.user._id)) {
    return res.status(404).json({ message: "Leave request not found" });
  }
  if (leave.status !== "Pending") {
    return res.status(409).json({ message: "Only pending requests can be cancelled" });
  }
  await leave.deleteOne();
  res.json({ message: "Leave request cancelled" });
});

module.exports = router;
