import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, CalendarCheck, CheckCircle2, AlarmClock, Timer } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, SkeletonList, StatCard, inputCls, th, td
} from "../components/ui";

const minutesBetween = (a, b) =>
  Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));

const hours = (a, b) => {
  if (!b) return "--";
  const mins = minutesBetween(a, b);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
};

const clock = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const dayLabel = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short"
  });

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState("");
  const [tab, setTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const tableRef = useRef(null);

  // Show a tab (All / Present / Late) and bring the table into view
  const showTab = (name) => {
    setTab(name);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const load = async () => {
    try {
      const { data } = await api.get("/attendance", {
        params: date ? { date } : {}
      });
      setRecords(data);
    } catch {
      toast.error("Unable to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const action = async (type) => {
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === "check-in"
        ? "Checked in successfully"
        : "Checked out successfully");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  const present = records.filter((r) => r.status === "Present").length;
  const late = records.filter((r) => r.status === "Late").length;
  const done = records.filter((r) => r.checkOut);
  const avgMins = done.length
    ? Math.round(done.reduce((t, r) => t + minutesBetween(r.checkIn, r.checkOut), 0) / done.length)
    : 0;
  const onTimePct = records.length ? Math.round((present / records.length) * 100) : 0;

  const shown = tab === "All" ? records : records.filter((r) => r.status === tab);
  const tabs = [["All", records.length], ["Present", present], ["Late", late]];

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance"
        subtitle={user.role === "Admin"
          ? "Daily check-ins across the team"
          : "Your check-in and check-out history"} />

      {user.role === "Employee" && (
        <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden
          rounded-3xl bg-linear-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white
          shadow-xl shadow-indigo-200">
          <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative">
            <h2 className="text-lg font-bold">Mark your attendance</h2>
            <p className="text-sm text-blue-100">
              Check in when you start work and check out when you finish.
            </p>
          </div>
          <div className="relative flex gap-3">
            <button onClick={() => action("check-in")}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm
              font-semibold text-blue-700 shadow transition hover:bg-blue-50">
              <LogIn size={18} /> Check In
            </button>
            <button onClick={() => action("check-out")}
              className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm
              font-semibold ring-1 ring-white/40 transition hover:bg-white/25">
              <LogOut size={18} /> Check Out
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Records" value={records.length} Icon={CalendarCheck} tone="blue"
          hint={date ? `On ${dayLabel(date)}` : "Click to show all"}
          active={tab === "All"} onClick={() => showTab("All")} />
        <StatCard label="On Time" value={present} Icon={CheckCircle2} tone="green"
          hint={`${onTimePct}% of check-ins`}
          active={tab === "Present"} onClick={() => showTab("Present")} />
        <StatCard label="Late" value={late} Icon={AlarmClock} tone="amber"
          hint="Checked in after 09:30"
          active={tab === "Late"} onClick={() => showTab("Late")} />
        <StatCard label="Average Hours" value={done.length ? `${Math.floor(avgMins / 60)}h ${String(avgMins % 60).padStart(2, "0")}m` : "--"}
          Icon={Timer} tone="violet" hint={`${done.length} completed day${done.length === 1 ? "" : "s"} · click to view`}
          onClick={() => showTab("All")} />
      </div>

      <Card className="scroll-mt-24 overflow-hidden" ref={tableRef}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex gap-2">
            {tabs.map(([name, count]) => (
              <button key={name} onClick={() => setTab(name)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  tab === name
                    ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}>
                {name} <span className="ml-1 opacity-70">{count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className={`${inputCls} w-auto py-2`} />
            {date && (
              <button onClick={() => setDate("")}
                className="text-sm font-medium text-blue-600 hover:underline">Clear</button>
            )}
          </div>
        </div>

        {/* Phones: one card per record, with check-in, check-out, hours and status all visible */}
        <ul className="divide-y divide-slate-100 sm:hidden">
          {loading ? <SkeletonList /> : shown.map((r) => (
            <li key={r._id} className={`px-5 py-4 ${r.status === "Late" ? "bg-amber-50/30" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={r.employee?.name} size="h-9 w-9 text-xs" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{r.employee?.name}</p>
                    <p className="text-xs text-slate-500">{dayLabel(r.date)}</p>
                  </div>
                </div>
                <Badge value={r.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Check in</p>
                  <p className="font-medium text-emerald-700">{clock(r.checkIn)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Check out</p>
                  <p className="font-medium text-rose-600">{r.checkOut ? clock(r.checkOut) : "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Hours</p>
                  <p className="font-medium text-slate-800">{hours(r.checkIn, r.checkOut)}</p>
                </div>
              </div>
            </li>
          ))}
          {!loading && shown.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-slate-400">No attendance records</li>
          )}
        </ul>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Employee", "Date", "Check In", "Check Out", "Hours", "Status"].map((h) =>
                  <th key={h} className={th}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <SkeletonRows cols={6} /> : shown.map((r) => (
                <tr key={r._id} className={`transition hover:bg-slate-50/70 ${
                  r.status === "Late" ? "bg-amber-50/30" : ""}`}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employee?.name} size="h-9 w-9 text-xs" />
                      <div>
                        <p className="font-medium text-slate-800">{r.employee?.name}</p>
                        {r.employee?.department && (
                          <p className="text-xs text-slate-500">{r.employee.department}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={td}>{dayLabel(r.date)}</td>
                  <td className={td}>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <LogIn size={14} /> {clock(r.checkIn)}
                    </span>
                  </td>
                  <td className={td}>
                    {r.checkOut ? (
                      <span className="flex items-center gap-1.5 text-rose-600">
                        <LogOut size={14} /> {clock(r.checkOut)}
                      </span>
                    ) : <span className="text-slate-300">--</span>}
                  </td>
                  <td className={`${td} font-medium text-slate-800`}>{hours(r.checkIn, r.checkOut)}</td>
                  <td className={td}><Badge value={r.status} /></td>
                </tr>
              ))}
              {!loading && shown.length === 0 && <EmptyRow cols={6} text="No attendance records" />}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
