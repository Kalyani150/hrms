import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Users, CalendarDays, Wallet, CalendarCheck, X, UserPlus, ClipboardCheck, BadgeIndianRupee, UserCheck, CircleCheck, Building2 } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Card, Avatar, Badge, StatCard, th, td } from "../ui";
import { money, time, short, greeting, Hero, HeroAction, CardTitle, MiniStat, AttendanceChart, DepartmentBars } from "./parts";

export default function AdminDashboard({ user, data, reload }) {
  const [tab, setTab] = useState("present");

  const review = async (id, status) => {
    try {
      await api.patch(`/leaves/${id}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update leave");
    }
  };

  const p = data.payroll;
  const completion = p.total ? Math.round((p.paid / p.total) * 100) : 0;
  const monthLabel = new Date(`${p.month}-01T00:00:00`).toLocaleDateString("en-IN", {
    month: "long", year: "numeric"
  });
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const tabs = [
    ["present", "Present", data.presentToday],
    ["onLeave", "On Leave", data.onLeaveToday],
    ["absent", "Absent", data.absentToday]
  ];
  const list = data.employeeStatus[tab];

  return (
    <div className="space-y-6">
      <Hero>
        <p className="text-sm text-blue-100">{today}</p>
        <h1 className="mt-1 text-2xl font-bold md:text-3xl">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-blue-100">
          {data.pendingLeaves > 0
            ? `${data.pendingLeaves} leave request${data.pendingLeaves > 1 ? "s are" : " is"} waiting for your review.`
            : "You're all caught up. No pending leave requests."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <HeroAction to="/employees" Icon={UserPlus} label="Add employee" />
          <HeroAction to="/leaves" Icon={ClipboardCheck} label="Review leaves" />
          <HeroAction to="/payroll" Icon={BadgeIndianRupee} label="Run payroll" />
        </div>
      </Hero>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Employees" value={data.totalEmployees} Icon={Users} tone="blue"
          hint={`Active ${data.activeEmployees} · Inactive ${data.inactiveEmployees}`} to="/employees" />
        <StatCard label="Leave Requests" value={data.pendingLeaves} Icon={CalendarDays} tone="amber"
          hint={`${data.approvedLeaves} approved · pending review`} to="/leaves" />
        <StatCard label="Present Today" value={data.presentToday} Icon={CalendarCheck} tone="green"
          hint={`${data.onLeaveToday} on leave · ${data.absentToday} absent`} to="/attendance" />
        <StatCard label="Payroll Completion" value={`${completion}%`} Icon={Wallet} tone="violet"
          hint={`${p.paidCount}/${p.count} payslips paid`} to="/payroll" />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 md:grid-cols-3">
        <MiniStat label="Active Employees" value={data.activeEmployees} Icon={UserCheck} tone="green"
          hint={`of ${data.totalEmployees} total`} to="/employees" />
        <MiniStat label="Approved Leaves" value={data.approvedLeaves} Icon={CircleCheck} tone="blue"
          hint="All time" to="/leaves" />
        <MiniStat label="Total Departments" value={data.totalDepartments} Icon={Building2} tone="violet"
          hint="Across the company" to="/employees" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 *:min-w-0">
        <Card className="p-5 lg:col-span-2">
          <CardTitle sub="Check-ins over the last 7 working days" to="/attendance">
            Attendance Trend
          </CardTitle>
          <div className="mt-5"><AttendanceChart data={data.attendanceTrend} /></div>
        </Card>
        <Card className="p-5">
          <CardTitle sub="Active employees per department">By Department</CardTitle>
          <div className="mt-5"><DepartmentBars rows={data.departmentCounts} /></div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 *:min-w-0">
        <div className="space-y-6 xl:col-span-2">
        <Card className="overflow-hidden">
          <div className="p-5"><CardTitle to="/leaves">Leave Management</CardTitle></div>
          {/* Phones: one card per request, so Approve / Reject are always visible */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {data.recentLeaves.map((l) => (
              <li key={l._id} className="space-y-3 px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={l.employee?.name} size="h-9 w-9 text-xs" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{l.employee?.name}</p>
                      <p className="text-xs text-slate-500">
                        {l.type} · {l.startDate === l.endDate
                          ? short(l.startDate)
                          : `${short(l.startDate)} – ${short(l.endDate)}`}
                      </p>
                    </div>
                  </div>
                  <Badge value={l.status} />
                </div>
                {l.status === "Pending" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => review(l._id, "Approved")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5
                      text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                      <Check size={16} /> Approve
                    </button>
                    <button onClick={() => review(l._id, "Rejected")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 py-2.5
                      text-sm font-medium text-rose-700 hover:bg-rose-100">
                      <X size={16} /> Reject
                    </button>
                  </div>
                )}
              </li>
            ))}
            {data.recentLeaves.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-400">No leave requests yet</li>
            )}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Employee Name", "Leave Type", "Date", "Status", "Action"].map((h) =>
                    <th key={h} className={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentLeaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={l.employee?.name} size="h-9 w-9 text-xs" />
                        <span className="font-medium text-slate-800">{l.employee?.name}</span>
                      </div>
                    </td>
                    <td className={td}>{l.type}</td>
                    <td className={td}>
                      {l.startDate === l.endDate
                        ? short(l.startDate)
                        : `${short(l.startDate)} – ${short(l.endDate)}`}
                    </td>
                    <td className={td}><Badge value={l.status} /></td>
                    <td className={td}>
                      {l.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button onClick={() => review(l._id, "Approved")} title="Approve"
                            className="rounded-lg bg-emerald-50 p-2 text-emerald-600 hover:bg-emerald-100">
                            <Check size={16} />
                          </button>
                          <button onClick={() => review(l._id, "Rejected")} title="Reject"
                            className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
                            <X size={16} />
                          </button>
                        </div>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ))}
                {data.recentLeaves.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                    No leave requests yet
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle to="/employees" sub="The latest people added to the team">
            Recently Added Employees
          </CardTitle>
          {data.recentEmployees.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.recentEmployees.map((emp) => (
                <li key={emp._id}>
                  <Link to="/employees" className="flex items-center gap-4 rounded-xl py-3 transition hover:bg-slate-50">
                    <Avatar name={emp.name} size="h-11 w-11 text-sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800">{emp.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {[emp.designation, emp.department].filter(Boolean).join(" · ") || emp.email}
                      </p>
                    </div>
                    <span className="hidden text-xs text-slate-400 sm:block">
                      Joined {emp.joiningDate ? short(emp.joiningDate.slice(0, 10)) : "—"}
                    </span>
                    <Badge value={emp.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No employees yet</p>
          )}
        </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <CardTitle to="/attendance">Employee Status</CardTitle>
            <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {tabs.map(([key, label, count]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                    tab === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
                  }`}>
                  {label} ({count})
                </button>
              ))}
            </div>
            <ul className="mt-4 space-y-3">
              {list.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <Avatar name={e.name} size="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{e.name}</p>
                    <p className="truncate text-xs text-slate-500">{e.designation || "—"}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {tab === "present" && `${e.note} · ${time(e.time)}`}
                    {tab === "onLeave" && `Until ${short(e.until.slice(0, 10))}`}
                    {tab === "absent" && "Not in"}
                  </span>
                </li>
              ))}
              {list.length === 0 && (
                <li className="py-6 text-center text-sm text-slate-400">Nobody here</li>
              )}
            </ul>
          </Card>

          <Card className="p-5">
            <CardTitle sub={monthLabel}>Payroll Overview</CardTitle>
            <p className="mt-4 text-xs text-slate-500">Total Payroll</p>
            <p className="text-3xl font-bold text-slate-800">{money(p.total)}</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all"
                style={{ width: `${completion}%` }} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> Paid Amount
                </span>
                <span className="font-semibold text-slate-800">{money(p.paid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Unpaid Amount
                </span>
                <span className="font-semibold text-slate-800">{money(p.unpaid)}</span>
              </div>
            </div>
            <Link to="/payroll" className="mt-5 block rounded-xl border border-slate-200 py-2.5
              text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
              View All
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
