const { z } = require("zod");
const User = require("../models/User");
const {
  nameSchema, emailSchema, phoneSchema, passwordSchema, textSchema, amountSchema
} = require("../utils/validation");

const baseFields = {
  name: nameSchema,
  email: emailSchema,
  role: z.enum(["Admin", "Employee"]),
  department: textSchema("Department"),
  designation: textSchema("Designation"),
  phone: phoneSchema,
  address: z.string().trim().max(300, "Address must be at most 300 characters"),
  salary: amountSchema("Salary"),
  // the form sends "" when the date is left blank
  joiningDate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
  status: z.enum(["Active", "Inactive"])
};

const createSchema = z.object({
  ...baseFields,
  password: passwordSchema
}).partial({
  role: true, department: true, designation: true, phone: true, address: true,
  salary: true, joiningDate: true, status: true
});

const updateSchema = z.object({
  ...baseFields,
  password: passwordSchema
}).partial();

const handleDuplicate = (err, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({ message: "An employee with this email already exists" });
  }
  next(err);
};

// GET /api/employees?search=&status=   (Admin) - returns an array of employees
async function listEmployees(req, res) {
  const filter = { role: "Employee" };
  if (["Active", "Inactive"].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const term = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(term, "i");
    filter.$or = [{ name: rx }, { email: rx }, { department: rx }, { designation: rx }];
  }

  const employees = await User.find(filter).sort({ createdAt: -1 });
  res.json(employees);
}

// GET /api/employees/:id   (Admin, or the employee themselves)
async function getEmployee(req, res) {
  const isSelf = req.user._id.equals(req.params.id);
  if (!isSelf && req.user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  const employee = await User.findById(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json({ employee });
}

// POST /api/employees   (Admin)
async function createEmployee(req, res, next) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  try {
    const employee = await User.create(parsed.data);
    res.status(201).json({ employee });
  } catch (err) {
    handleDuplicate(err, res, next);
  }
}

// PUT /api/employees/:id   (Admin)
async function updateEmployee(req, res, next) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const isSelf = req.user._id.equals(req.params.id);
  if (isSelf && (parsed.data.role === "Employee" || parsed.data.status === "Inactive")) {
    return res.status(400).json({ message: "You cannot demote or deactivate your own account" });
  }

  const employee = await User.findById(req.params.id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  // save() (not findByIdAndUpdate) so the password hash hook runs
  employee.set(parsed.data);
  try {
    await employee.save();
    res.json({ employee });
  } catch (err) {
    handleDuplicate(err, res, next);
  }
}

// PATCH /api/employees/:id/deactivate   (Admin) - keeps attendance/leave/payroll history
async function deactivateEmployee(req, res) {
  if (req.user._id.equals(req.params.id)) {
    return res.status(400).json({ message: "You cannot deactivate your own account" });
  }
  const employee = await User.findByIdAndUpdate(
    req.params.id,
    { status: "Inactive" },
    { returnDocument: "after" }
  );
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json({ message: "Employee deactivated", employee });
}

// PATCH /api/employees/:id/reactivate   (Admin) - lets a deactivated employee log in again
async function reactivateEmployee(req, res) {
  const employee = await User.findByIdAndUpdate(
    req.params.id,
    { status: "Active" },
    { returnDocument: "after" }
  );
  if (!employee) return res.status(404).json({ message: "Employee not found" });
  res.json({ message: "Employee reactivated", employee });
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee
};
