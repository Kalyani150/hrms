const mongoose = require("mongoose");
const { z } = require("zod");
const Payroll = require("../models/Payroll");
const User = require("../models/User");
const { amountSchema, MAX_AMOUNT } = require("../utils/validation");

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format");

const createSchema = z.object({
  employee: z.string().refine(mongoose.isValidObjectId, "Invalid employee id"),
  month,
  basic: amountSchema("Basic pay").optional(), // defaults to the employee's salary
  bonus: amountSchema("Bonus").default(0),
  deductions: amountSchema("Deductions").default(0)
});

const updateSchema = z.object({
  basic: amountSchema("Basic pay"),
  bonus: amountSchema("Bonus"),
  deductions: amountSchema("Deductions"),
  updateSalary: z.boolean() // also save `basic` as the employee's monthly salary
}).partial();

const DEDUCTION_ERROR = "Deductions cannot be more than basic pay plus bonus";

const net = (basic, bonus, deductions) => Math.max(0, basic + bonus - deductions);

// Net salary has the same limit as the other amounts (basic and bonus together could pass it)
const NET_ERROR = `Net salary cannot be more than ${MAX_AMOUNT.toLocaleString("en-IN")}`;
const netTooHigh = (basic, bonus, deductions) =>
  Math.round(net(basic, bonus, deductions) * 100) / 100 > MAX_AMOUNT; // ignores float rounding noise

const rupees = (n) => n.toLocaleString("en-IN");
const alreadyExists = { message: "Payroll for this employee and month already exists" };

// All payslips of one month together have the same limit, so the month's "Total net payroll" stays
// below 10 lakh. Returns an error message when adding `netSalary` would pass it, otherwise "".
async function monthTotalError(forMonth, netSalary, excludeId) {
  const [row] = await Payroll.aggregate([
    { $match: { month: forMonth, ...(excludeId && { _id: { $ne: excludeId } }) } },
    { $group: { _id: null, total: { $sum: "$netSalary" } } }
  ]);
  const others = row?.total || 0;
  if (Math.round((others + netSalary) * 100) / 100 <= MAX_AMOUNT) return "";

  const left = Math.max(0, Math.round((MAX_AMOUNT - others) * 100) / 100);
  const label = new Date(`${forMonth}-01T00:00:00Z`)
    .toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
  return `Total net payroll for ${label} cannot be more than ${rupees(MAX_AMOUNT)}. Amount left for this payslip: ${rupees(left)}`;
}

// GET /api/payroll?month=YYYY-MM&status=Pending|Paid
// Admin: everyone's payslips. Employee: only their own.
async function listPayroll(req, res) {
  const filter = {};
  if (req.user.role !== "Admin") filter.employee = req.user._id;
  if (month.safeParse(req.query.month).success) filter.month = req.query.month;
  if (["Pending", "Paid"].includes(req.query.status)) filter.status = req.query.status;

  const payroll = await Payroll.find(filter)
    .populate("employee", "name email department designation")
    .sort({ month: -1, createdAt: -1 })
    .limit(500);
  res.json(payroll);
}

// POST /api/payroll   (Admin: create one payslip)
async function createPayroll(req, res, next) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const d = parsed.data;

  const employee = await User.findById(d.employee);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const basic = d.basic ?? employee.salary;
  // a salary saved before the current limit must not go onto a new payslip
  if (basic > MAX_AMOUNT) {
    return res.status(400).json({
      message: `Basic pay cannot be more than ${MAX_AMOUNT.toLocaleString("en-IN")}. Update the employee's salary first.`
    });
  }
  if (d.deductions > basic + d.bonus) return res.status(400).json({ message: DEDUCTION_ERROR });
  if (netTooHigh(basic, d.bonus, d.deductions)) return res.status(400).json({ message: NET_ERROR });
  // checked before the month total, so a repeated payslip is reported as such
  if (await Payroll.exists({ employee: employee._id, month: d.month })) {
    return res.status(409).json(alreadyExists);
  }
  const totalError = await monthTotalError(d.month, net(basic, d.bonus, d.deductions));
  if (totalError) return res.status(400).json({ message: totalError });
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
      return res.status(409).json(alreadyExists);
    }
    next(err);
  }
}

// PUT /api/payroll/:id   (Admin: edit amounts of an unpaid payslip)
async function updatePayroll(req, res) {
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
  const previousNet = payroll.netSalary;
  payroll.set(amounts);
  if (payroll.deductions > payroll.basic + payroll.bonus) {
    return res.status(400).json({ message: DEDUCTION_ERROR });
  }
  if (netTooHigh(payroll.basic, payroll.bonus, payroll.deductions)) {
    return res.status(400).json({ message: NET_ERROR });
  }
  payroll.netSalary = net(payroll.basic, payroll.bonus, payroll.deductions);
  // only an increase is checked, so payslips in a month already over the limit can still be reduced
  if (payroll.netSalary > previousNet) {
    const totalError = await monthTotalError(payroll.month, payroll.netSalary, payroll._id);
    if (totalError) return res.status(400).json({ message: totalError });
  }
  await payroll.save();

  // Optionally carry the new basic over to the employee's profile salary
  if (updateSalary && amounts.basic !== undefined) {
    await User.findByIdAndUpdate(payroll.employee, { salary: payroll.basic });
  }

  res.json({ payroll, salaryUpdated: !!(updateSalary && amounts.basic !== undefined) });
}

// PATCH /api/payroll/:id/pay   (Admin: mark as paid)
async function markPaid(req, res) {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) return res.status(404).json({ message: "Payroll record not found" });
  if (payroll.status === "Paid") {
    return res.status(409).json({ message: "Already marked as paid" });
  }
  payroll.status = "Paid";
  payroll.paidAt = new Date();
  await payroll.save();
  res.json({ payroll });
}

// DELETE /api/payroll/:id   (Admin: remove a payslip)
async function deletePayroll(req, res) {
  const payroll = await Payroll.findByIdAndDelete(req.params.id);
  if (!payroll) return res.status(404).json({ message: "Payroll record not found" });
  res.json({ message: "Payroll record deleted" });
}

module.exports = {
  listPayroll,
  createPayroll,
  updatePayroll,
  markPaid,
  deletePayroll
};
