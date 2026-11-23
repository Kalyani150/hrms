import { Link } from "react-router-dom";
import { Users, CalendarDays, Wallet, ArrowRight, LogIn, LogOut, Clock, UserMinus, Sparkles, Mail, Phone, IdCard, Briefcase } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Card, Avatar, Badge, StatCard, btnPrimary, th, td } from "../ui";
import { money, time, short, greeting, Hero, HeroAction, CardTitle, HoursChart } from "./parts";

export default function EmployeeDashboard({ user, data, reload }) {
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

      <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 min-[890px]:grid-cols-3 sm:gap-5 xl:grid-cols-4">
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
          <Card className="p-4 sm:p-5">
            <CardTitle sub="Hours worked on your last 7 attendance days" to="/attendance">
              My Hours
            </CardTitle>
            <div className="mt-5"><HoursChart records={data.attendance} /></div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 sm:p-5"><CardTitle to="/attendance">Recent Attendance</CardTitle></div>
            {/* Phones: one row per day with the status always visible */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {data.attendance.slice(0, 5).map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
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
                <li className="px-4 py-10 text-center sm:px-5 text-sm text-slate-400">No attendance yet</li>
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
                    <tr><td colSpan={4} className="px-4 py-10 text-center sm:px-5 text-sm text-slate-400">
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

          <Card className="p-4 sm:p-5">
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

          <Card className="p-4 sm:p-5">
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
