// /api/employees - the handlers are in controllers/employeeController.js
const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const checkId = require("../middleware/checkId")("employee");
const employees = require("../controllers/employeeController");

const router = express.Router();

router.use(protect);

router.get("/", authorize("Admin"), employees.listEmployees);
router.get("/:id", checkId, employees.getEmployee); // Admin, or the employee themselves
router.post("/", authorize("Admin"), employees.createEmployee);
router.put("/:id", authorize("Admin"), checkId, employees.updateEmployee);
router.patch("/:id/deactivate", authorize("Admin"), checkId, employees.deactivateEmployee);
router.patch("/:id/reactivate", authorize("Admin"), checkId, employees.reactivateEmployee);

module.exports = router;
