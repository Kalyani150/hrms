const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");

const TIME_ZONE = "Asia/Kolkata";
const LEAVE_ALLOWANCE = Number(process.env.LEAVE_ALLOWANCE) || 20; // days per year

const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date()); // YYYY-MM-DD

const dayCount = (l) =>
  Math.round((l.endDate - l.startDate) / 86400000) + 1;

// Last 7 weekdays up to and including `date`, oldest first (YYYY-MM-DD)
function lastWeekdays(date, count = 7) {
  const out = [];
  for (let i = 0; out.length < count && i < 21; i++) {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) out.push(d.toISOString().slice(0, 10));
  }
  return out.reverse();
}

// Who is present / on leave / absent today (employees only, active only)
async function todayStatus(date) {
  const day = new Date(`${date}T00:00:00Z`);

  const [employees, attendance, onLeaveDocs] = await Promise.all([
    User.find({ role: "Employee", status: "Active" }).select("name designation department"),
    Attendance.find({ date }).populate("employee", "name designation role status"),
    Leave.find({ status: "Approved", startDate: { $lte: day }, endDate: { $gte: day } })
      .populate("employee", "name designation role status")
  ]);

  const isStaff = (e) => e && e.role === "Employee" && e.status === "Active";

  const present = attendance
    .filter((a) => isStaff(a.employee))
    .map((a) => ({
      id: a.employee._id,
      name: a.employee.name,
      designation: a.employee.designation,
      note: a.status,
      time: a.checkIn
    }));

  const onLeave = onLeaveDocs
    .filter((l) => isStaff(l.employee))
    .map((l) => ({
      id: l.employee._id,
      name: l.employee.name,
      designation: l.employee.designation,
      note: l.type,
      until: l.endDate
    }));

  const busy = new Set([...present, ...onLeave].map((p) => String(p.id)));
  const absent = employees
    .filter((e) => !busy.has(String(e._id)))
    .map((e) => ({ id: e._id, name: e.name, designation: e.designation, note: "Absent" }));

  return { activeEmployees: employees.length, present, onLeave, absent };
}

// GET /api/dashboard   (Admin and Employee get different data)
async function getDashboard(req, res, next) {
  try {
    const date = todayKey();
    const month = date.slice(0, 7);
    const status = await todayStatus(date);

    // ---------- Employee view ----------
    if (req.user.role === "Employee") {
      const yearStart = new Date(`${date.slice(0, 4)}-01-01T00:00:00Z`);
      const yearEnd = new Date(`${date.slice(0, 4)}-12-31T00:00:00Z`);

      const [today, attendance, leaves, payroll, approvedThisYear] = await Promise.all([
        Attendance.findOne({ employee: req.user._id, date }),
        Attendance.find({ employee: req.user._id }).sort({ date: -1 }).limit(7),
        Leave.find({ employee: req.user._id }).sort({ createdAt: -1 }).limit(5),
        Payroll.find({ employee: req.user._id }).sort({ month: -1 }).limit(5),
        Leave.find({
          employee: req.user._id,
          status: "Approved",
          startDate: { $gte: yearStart, $lte: yearEnd }
        })
      ]);

      const taken = approvedThisYear.reduce((t, l) => t + dayCount(l), 0);

      return res.json({
        profile: req.user,
        today,
        attendance,
        leaves,
        payroll,
        leaveStats: {
          allowance: LEAVE_ALLOWANCE,
          taken,
          remaining: Math.max(0, LEAVE_ALLOWANCE - taken)
        },
        team: {
          total: status.activeEmployees,
          present: status.present.length,
          onLeave: status.onLeave.length,
          absent: status.absent.length
        }
      });
    }

    // ---------- Admin view ----------
    const weekdays = lastWeekdays(date);
    const [
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      approvedLeaves,
      departments,
      recentEmployees,
      recentLeaves,
      payrollByStatus,
      trendRows,
      departmentRows
    ] = await Promise.all([
      User.countDocuments({ role: "Employee" }),
      User.countDocuments({ role: "Employee", status: "Active" }),
      Leave.countDocuments({ status: "Pending" }),
      Leave.countDocuments({ status: "Approved" }),
      User.distinct("department", { role: "Employee" }),
      User.find({ role: "Employee" }).sort({ createdAt: -1 }).limit(5),
      Leave.find()
        .populate("employee", "name department designation")
        .sort({ createdAt: -1 })
        .limit(8),
      Payroll.aggregate([
        { $match: { month } },
        { $group: { _id: "$status", total: { $sum: "$netSalary" }, count: { $sum: 1 } } }
      ]),
      Attendance.aggregate([
        { $match: { date: { $in: weekdays } } },
        { $group: { _id: { date: "$date", status: "$status" }, count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { role: "Employee", status: "Active" } },
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const attendanceTrend = weekdays.map((d) => {
      const count = (s) =>
        trendRows.find((r) => r._id.date === d && r._id.status === s)?.count || 0;
      return { date: d, present: count("Present"), late: count("Late") };
    });
    const departmentCounts = departmentRows.map((r) => ({
      name: r._id || "Unassigned",
      count: r.count
    }));

    const pay = { month, total: 0, paid: 0, unpaid: 0, count: 0, paidCount: 0 };
    for (const row of payrollByStatus) {
      pay.total += row.total;
      pay.count += row.count;
      if (row._id === "Paid") {
        pay.paid += row.total;
        pay.paidCount += row.count;
      } else {
        pay.unpaid += row.total;
      }
    }

    res.json({
      totalEmployees,
      activeEmployees,
      inactiveEmployees: totalEmployees - activeEmployees,
      presentToday: status.present.length,
      onLeaveToday: status.onLeave.length,
      absentToday: status.absent.length,
      pendingLeaves,
      approvedLeaves,
      totalDepartments: departments.filter(Boolean).length,
      monthlySalary: pay.total,
      payroll: pay,
      employeeStatus: {
        present: status.present.slice(0, 8),
        onLeave: status.onLeave.slice(0, 8),
        absent: status.absent.slice(0, 8)
      },
      recentLeaves,
      recentEmployees,
      attendanceTrend,
      departmentCounts
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getDashboard };
