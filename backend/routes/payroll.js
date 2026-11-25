// /api/payroll - the handlers are in controllers/payrollController.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const checkId = require("../middleware/checkId")("payroll");
const payroll = require("../controllers/payrollController");

const router = express.Router();

router.use(protect);

router.get("/", payroll.listPayroll); // Admin: everyone's, Employee: own
router.post("/", authorize("Admin"), payroll.createPayroll);
router.put("/:id", authorize("Admin"), checkId, payroll.updatePayroll);
router.patch("/:id/pay", authorize("Admin"), checkId, payroll.markPaid);
router.delete("/:id", authorize("Admin"), checkId, payroll.deletePayroll);

module.exports = router;
