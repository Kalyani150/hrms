const express = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const Payroll = require("../models/Payroll");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format");

const createSchema = z.object({
  employee: z.string().refine(mongoose.isValidObjectId, "Invalid employee id"),
  month,
  basic: z.coerce.number().min(0).optional(), // defaults to the employee's salary
  bonus: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0)
});

const updateSchema = z.object({
  basic: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  updateSalary: z.boolean() // also save `basic` as the employee's monthly salary
}).partial();

const generateSchema = z.object({ month });

const net = (basic, bonus, deductions) => Math.max(0, basic + bonus - deductions);

const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid payroll id" });
  }
  next();
};

// GET /api/payroll?month=YYYY-MM&status=Pending|Paid
// Admin: everyone's payslips. Employee: only their own.
router.get("/", async (req, res) => {
  const filter = {};
  if (req.user.role !== "Admin") filter.employee = req.user._id;
  if (month.safeParse(req.query.month).success) filter.month = req.query.month;
  if (["Pending", "Paid"].includes(req.query.status)) filter.status = req.query.status;

  const payroll = await Payroll.find(filter)
    .populate("employee", "name email department designation")
    .sort({ month: -1, createdAt: -1 })
    .limit(500);
  res.json(payroll);
});

// POST /api/payroll   (Admin: create one payslip)
router.post("/", authorize("Admin"), async (req, res, next) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const d = parsed.data;

  const employee = await User.findById(d.employee);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const basic = d.basic ?? employee.salary;
  try {
    const payroll = await Payroll.create({
      employee: employee._id,
      month: d.month,
      basic,
      bonus: d.bonus,
      deductions: d.deductions,
      netSalary: net(basic, d.bonus, d.deductions)
    });
    res.status(201).json({ payroll });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Payroll for this employee and month already exists" });
    }
    next(err);
  }
});

// POST /api/payroll/generate   (Admin: payslips for all active employees for a month)
router.post("/generate", authorize("Admin"), async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const employees = await User.find({ status: "Active", role: "Employee" });
  const existing = await Payroll.find({ month: parsed.data.month }).distinct("employee");
  const done = new Set(existing.map(String));

  const docs = employees
    .filter((e) => !done.has(String(e._id)))
    .map((e) => ({
      employee: e._id,
      month: parsed.data.month,
      basic: e.salary,
      bonus: 0,
      deductions: 0,
      netSalary: e.salary
    }));

  if (docs.length) await Payroll.insertMany(docs);
  res.status(201).json({
    message: `Generated ${docs.length} payslip(s), skipped ${employees.length - docs.length} existing`,
    created: docs.length
  });
});

// PUT /api/payroll/:id   (Admin: edit amounts of an unpaid payslip)
router.put("/:id", authorize("Admin"), checkId, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) return res.status(404).json({ message: "Payroll record not found" });
  if (payroll.status === "Paid") {
    return res.status(409).json({ message: "Paid payroll cannot be edited" });
  }

  const { updateSalary, ...amounts } = parsed.data;
  payroll.set(amounts);
  payroll.netSalary = net(payroll.basic, payroll.bonus, payroll.deductions);
  await payroll.save();

  // Optionally carry the new basic over to the employee's profile salary
  if (updateSalary && amounts.basic !== undefined) {
    await User.findByIdAndUpdate(payroll.employee, { salary: payroll.basic });
  }

  res.json({ payroll, salaryUpdated: !!(updateSalary && amounts.basic !== undefined) });
});

// PATCH /api/payroll/:id/pay   (Admin: mark as paid)
router.patch("/:id/pay", authorize("Admin"), checkId, async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) return res.status(404).json({ message: "Payroll record not found" });
  if (payroll.status === "Paid") {
    return res.status(409).json({ message: "Already marked as paid" });
  }
  payroll.status = "Paid";
  payroll.paidAt = new Date();
  await payroll.save();
  res.json({ payroll });
});

module.exports = router;
