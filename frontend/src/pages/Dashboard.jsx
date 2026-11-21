import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, CalendarDays, Wallet, CalendarCheck, Check, X, ArrowRight,
  LogIn, LogOut, Clock, UserMinus, Sparkles, UserPlus, ClipboardCheck,
  BadgeIndianRupee, UserCheck, CircleCheck, Building2, Mail, Phone, IdCard,
  Briefcase
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Card, Avatar, Badge, StatCard, btnPrimary, th, td } from "../components/ui";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const time = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const short = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const weekday = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ------------------------------------------------------------------ */
/* shared pieces                                                       */
/* ------------------------------------------------------------------ */
function Hero({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600
      via-indigo-600 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200 md:p-8">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-white/10" />
      <div className="relative">{children}</div>
    </div>
  );
}

function HeroAction({ to, Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5
      text-sm font-medium backdrop-blur transition hover:bg-white/25">
      <Icon size={17} /> {label}
    </Link>
  );
}

function CardTitle({ children, sub, to, linkText = "See all" }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="font-bold text-slate-800">{children}</h2>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
          {linkText} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function Tip({ children }) {
  return (
    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden
      -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-800
      px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
      {children}
    </div>
  );
}

const miniTones = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600"
};

// Compact clickable stat for the second row
function MiniStat({ label, value, hint, Icon, tone, to }) {
  return (
    <Link to={to} className="block rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
      <Card className="flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
        <span className={`rounded-xl p-3 ${miniTones[tone]}`}><Icon size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold leading-tight text-slate-800">{value}</p>
        </div>
        <p className="hidden text-right text-xs text-slate-400 sm:block">{hint}</p>
      </Card>
    </Link>
  );
}

/* ---------- charts (plain HTML, one blue ramp + amber for "late") ---------- */
function AttendanceChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.present + d.late));
  return (
    <div>
      <div className="mb-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> On time</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Late</span>
      </div>
      <div className="flex h-44 items-end gap-3 border-b border-slate-100">
        {data.map((d) => {
          const total = d.present + d.late;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <Tip>{weekday(d.date)} {short(d.date)}: {d.present} on time, {d.late} late</Tip>
              <p className="mb-1 text-center text-xs font-semibold text-slate-600">{total || ""}</p>
              <div className="mx-auto flex w-full max-w-10 flex-col justify-end gap-0.5 transition
                group-hover:opacity-80" style={{ height: `${(total / max) * 82}%` }}>
                {d.late > 0 && (
                  <div className={`bg-amber-400 ${d.present ? "rounded-t-md rounded-b-[2px]" : "rounded-md"}`}
                    style={{ flex: d.late }} />
                )}
                {d.present > 0 && (
                  <div className={`bg-blue-600 ${d.late ? "rounded-b-md rounded-t-[2px]" : "rounded-md"}`}
                    style={{ flex: d.present }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {data.map((d) => (
          <p key={d.date} className="flex-1 text-center text-xs text-slate-500">{weekday(d.date)}</p>
        ))}
      </div>
    </div>
  );
}

function DepartmentBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-400">No departments yet</p>;
  }
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.name} className="group relative">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-slate-600">{r.name}</span>
            <span className="font-semibold text-slate-800">{r.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all"
              style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function HoursChart({ records }) {
  const rows = [...records].reverse().map((r) => ({
    date: r.date,
    hours: r.checkOut ? (new Date(r.checkOut) - new Date(r.checkIn)) / 36e5 : null
  }));
  const max = Math.max(9, ...rows.map((r) => r.hours || 0));
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-400">No attendance yet</p>;
  }
  return (
    <div>
      <div className="flex h-40 items-end gap-3 border-b border-slate-100">
        {rows.map((r) => (
          <div key={r.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <Tip>{weekday(r.date)} {short(r.date)}: {r.hours == null ? "no check-out" : `${r.hours.toFixed(1)} h`}</Tip>
            <p className="mb-1 text-center text-xs font-semibold text-slate-600">
              {r.hours == null ? "–" : r.hours.toFixed(1)}
            </p>
            <div className={`mx-auto w-full max-w-10 rounded-t-md transition group-hover:opacity-80 ${
              r.hours == null ? "border border-dashed border-slate-300" : "bg-linear-to-t from-blue-600 to-indigo-500"
            }`} style={{ height: `${r.hours == null ? 8 : Math.max(6, (r.hours / max) * 80)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        {rows.map((r) => (
          <p key={r.date} className="flex-1 text-center text-xs text-slate-500">{weekday(r.date)}</p>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ADMIN                                                               */
/* ------------------------------------------------------------------ */
function AdminDashboard({ user, data, reload }) {
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

/* ------------------------------------------------------------------ */
/* EMPLOYEE                                                            */
/* ------------------------------------------------------------------ */
function EmployeeDashboard({ user, data, reload }) {
  const { today, leaveStats, team, profile } = data;
  const latest = data.payroll[0];

  const punch = async (type) => {
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === "check-in" ? "Checked in successfully" : "Checked out successfully");
      reload();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  return (
    <div className="space-y-6">
      <Hero>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm text-blue-100">{dateLabel}</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              {greeting()}, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-blue-100">
              {[user.designation, user.department].filter(Boolean).join(" · ") || "Welcome to your workspace"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <HeroAction to="/leaves" Icon={CalendarDays} label="Apply leave" />
              <HeroAction to="/payroll" Icon={Wallet} label="My payslips" />
            </div>
          </div>

          <div className="w-full rounded-2xl bg-white/15 p-5 ring-1 ring-white/20 backdrop-blur sm:w-80">
            <p className="text-sm text-blue-100">
              {!today ? "Check-in required" : today.checkOut ? "Day completed" : "You're checked in"}
            </p>
            <p className="mt-1 text-3xl font-bold">
              {today ? time(today.checkIn) : "--:--"}
              {today?.checkOut && <span className="text-lg font-medium text-blue-100"> – {time(today.checkOut)}</span>}
            </p>
            {today && <p className="text-xs text-blue-100">Status: {today.status}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => punch("check-in")} disabled={!!today}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white py-2.5
                text-sm font-semibold text-blue-700 disabled:opacity-50">
                <LogIn size={16} /> Check in
              </button>
              <button onClick={() => punch("check-out")} disabled={!today || !!today.checkOut}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-white/20 py-2.5
                text-sm font-semibold ring-1 ring-white/40 disabled:opacity-50">
                <LogOut size={16} /> Check out
              </button>
            </div>
          </div>
        </div>
      </Hero>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Leaves Availed" value={leaveStats.taken} Icon={CalendarDays} tone="amber"
          hint={`of ${leaveStats.allowance} days this year`} to="/leaves" />
        <StatCard label="Leaves Remaining" value={leaveStats.remaining} Icon={Sparkles} tone="green"
          hint="Available to apply" to="/leaves" />
        <StatCard label="All Employees" value={team.total} Icon={Users} tone="blue"
          hint={`${team.present} present today`} />
        <StatCard label="People Absent" value={team.absent} Icon={UserMinus} tone="violet"
          hint={`${team.onLeave} on approved leave`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3 *:min-w-0">
        <div className="space-y-6 xl:col-span-2">
          <Card className="p-5">
            <CardTitle sub="Hours worked on your last 7 attendance days" to="/attendance">
              My Hours
            </CardTitle>
            <div className="mt-5"><HoursChart records={data.attendance} /></div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5"><CardTitle to="/attendance">Recent Attendance</CardTitle></div>
            {/* Phones: one row per day with the status always visible */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {data.attendance.slice(0, 5).map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <p className="font-medium text-slate-800">{a.date}</p>
                    <p className="text-xs text-slate-500">
                      {time(a.checkIn)} → {a.checkOut ? time(a.checkOut) : "--"}
                    </p>
                  </div>
                  <Badge value={a.status} />
                </li>
              ))}
              {data.attendance.length === 0 && (
                <li className="px-5 py-10 text-center text-sm text-slate-400">No attendance yet</li>
              )}
            </ul>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[480px] text-left">
                <thead className="bg-slate-50">
                  <tr>{["Date", "Check In", "Check Out", "Status"].map((h) =>
                    <th key={h} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.attendance.slice(0, 5).map((a) => (
                    <tr key={a._id}>
                      <td className={td}>{a.date}</td>
                      <td className={td}>{time(a.checkIn)}</td>
                      <td className={td}>{a.checkOut ? time(a.checkOut) : "--"}</td>
                      <td className={td}><Badge value={a.status} /></td>
                    </tr>
                  ))}
                  {data.attendance.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                      No attendance yet
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="h-16 bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500" />
            <div className="px-5 pb-5">
              <div className="-mt-8 flex items-end justify-between">
                <span className="rounded-full ring-4 ring-white">
                  <Avatar name={profile.name} size="h-16 w-16 text-lg" />
                </span>
                <Link to="/profile" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                  View profile <ArrowRight size={14} />
                </Link>
              </div>
              <h2 className="mt-3 text-lg font-bold text-slate-800">{profile.name}</h2>
              <p className="text-sm text-slate-500">
                {[profile.designation, profile.department].filter(Boolean).join(" · ") || profile.role}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-center gap-3"><IdCard size={16} className="text-slate-400" />
                  EMP-{String(profile._id).slice(-6).toUpperCase()}</li>
                <li className="flex items-center gap-3"><Mail size={16} className="text-slate-400" />
                  <span className="truncate">{profile.email}</span></li>
                <li className="flex items-center gap-3"><Phone size={16} className="text-slate-400" />
                  {profile.phone || <span className="text-slate-300">Not added</span>}</li>
                <li className="flex items-center gap-3"><Briefcase size={16} className="text-slate-400" />
                  {profile.department || "No department"}</li>
                <li className="flex items-center gap-3"><CalendarDays size={16} className="text-slate-400" />
                  Joined {profile.joiningDate
                    ? new Date(profile.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}</li>
              </ul>
            </div>
          </Card>

          <Card className="p-5">
            <CardTitle to="/payroll">Latest Payslip</CardTitle>
            {latest ? (
              <div className="mt-4">
                <p className="text-xs text-slate-500">
                  {new Date(`${latest.month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </p>
                <p className="text-3xl font-bold text-slate-800">{money(latest.netSalary)}</p>
                <div className="mt-2"><Badge value={latest.status} /></div>
                <div className="mt-4 space-y-1.5 text-sm text-slate-500">
                  <p className="flex justify-between"><span>Basic</span><span>{money(latest.basic)}</span></p>
                  <p className="flex justify-between"><span>Bonus</span><span className="text-emerald-600">+ {money(latest.bonus)}</span></p>
                  <p className="flex justify-between"><span>Deductions</span><span className="text-rose-600">− {money(latest.deductions)}</span></p>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">No payslip yet</p>
            )}
          </Card>

          <Card className="p-5">
            <CardTitle to="/leaves">My Requests</CardTitle>
            <ul className="mt-4 space-y-3">
              {data.leaves.map((l) => (
                <li key={l._id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="rounded-xl bg-violet-50 p-2 text-violet-600"><Clock size={16} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{l.type}</p>
                      <p className="text-xs text-slate-500">
                        {l.startDate === l.endDate ? short(l.startDate) : `${short(l.startDate)} – ${short(l.endDate)}`}
                      </p>
                    </div>
                  </div>
                  <Badge value={l.status} />
                </li>
              ))}
              {data.leaves.length === 0 && (
                <li className="py-4 text-center text-sm text-slate-400">No requests yet</li>
              )}
            </ul>
            <Link to="/leaves" className={`${btnPrimary} mt-5 w-full`}>Apply for leave</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    api.get("/dashboard")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Unable to load dashboard"));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return user.role === "Admin"
    ? <AdminDashboard user={user} data={data} reload={load} />
    : <EmployeeDashboard user={user} data={data} reload={load} />;
}
