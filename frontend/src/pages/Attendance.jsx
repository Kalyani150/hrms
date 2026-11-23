import { useEffect, useState } from "react";
import { LogIn, LogOut, CalendarCheck, CheckCircle2, AlarmClock, Timer } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, StatCard, Pagination, inputCls, th, td
} from "../components/ui";

const PAGE_SIZE = 10; // records per page

const minutesBetween = (a, b) =>
  Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));

const hours = (a, b) => {
  if (!b) return "--";
  const mins = minutesBetween(a, b);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
};

const clock = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

// Today's date as the backend sees it (YYYY-MM-DD in India time)
const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());

const dayLabel = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short"
  });

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [date, setDate] = useState("");
  const [tab, setTab] = useState("All");
  const [page, setPage] = useState(1);
  const [today, setToday] = useState(null); // my own record for today (employees)
  const [loading, setLoading] = useState(true);

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

  // Needed to block Check In / Check Out buttons whatever date filter is chosen below
  const loadToday = async () => {
    if (user.role !== "Employee") return;
    try {
      const { data } = await api.get("/attendance", { params: { date: todayKey() } });
      setToday(data[0] || null);
    } catch {
      /* the buttons stay enabled; the server still refuses a second check-in */
    }
  };

  useEffect(() => { loadToday(); }, []);

  const action = async (type) => {
    try {
      await api.post(`/attendance/${type}`);
      toast.success(type === "check-in"
        ? "Checked in successfully"
        : "Checked out successfully");
      load();
      loadToday();
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
  // Only one page of records is drawn at a time
  const lastPage = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visible = shown.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
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
            <button onClick={() => action("check-in")} disabled={!!today}
              className="flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm
              font-semibold text-blue-700 shadow transition hover:bg-blue-50
              disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white">
              <LogIn size={18} /> Check In
            </button>
            <button onClick={() => action("check-out")} disabled={!today || !!today.checkOut}
              className="flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm
              font-semibold ring-1 ring-white/40 transition hover:bg-white/25
              disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/15">
              <LogOut size={18} /> Check Out
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Records" value={records.length} Icon={CalendarCheck} tone="blue"
          hint={date ? `On ${dayLabel(date)}` : "All check-ins"} />
        <StatCard label="On Time" value={present} Icon={CheckCircle2} tone="green"
          hint={`${onTimePct}% of check-ins`} />
        <StatCard label="Late" value={late} Icon={AlarmClock} tone="amber"
          hint="Checked in after 09:30" />
        <StatCard label="Average Hours" value={done.length ? `${Math.floor(avgMins / 60)}h ${String(avgMins % 60).padStart(2, "0")}m` : "--"}
          Icon={Timer} tone="violet" hint={`${done.length} completed day${done.length === 1 ? "" : "s"}`} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex gap-2">
            {tabs.map(([name, count]) => (
              <button key={name} onClick={() => { setTab(name); setPage(1); }}
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
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className={`${inputCls} w-auto py-2`} />
            {date && (
              <button onClick={() => { setDate(""); setPage(1); }}
                className="text-sm font-medium text-blue-600 hover:underline">Clear</button>
            )}
          </div>
        </div>

        {/* scrolls sideways inside the card on small screens */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] sm:min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Employee", "Date", "Check In", "Check Out", "Hours", "Status"].map((h) =>
                  <th key={h} className={`${th} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-3.5!`}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <SkeletonRows cols={6} /> : visible.map((r) => (
                <tr key={r._id} className={`transition hover:bg-slate-50/70 ${
                  r.status === "Late" ? "bg-amber-50/30" : ""}`}>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employee?.name} size="h-8 w-8 text-[11px] sm:h-9 sm:w-9 sm:text-xs" />
                      <div>
                        <p className="font-medium text-slate-800">{r.employee?.name}</p>
                        {r.employee?.department && (
                          <p className="text-xs text-slate-500">{r.employee.department}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>{dayLabel(r.date)}</td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <LogIn size={14} /> {clock(r.checkIn)}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    {r.checkOut ? (
                      <span className="flex items-center gap-1.5 text-rose-600">
                        <LogOut size={14} /> {clock(r.checkOut)}
                      </span>
                    ) : <span className="text-slate-300">--</span>}
                  </td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! font-medium text-slate-800 sm:px-5! sm:py-4!`}>{hours(r.checkIn, r.checkOut)}</td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}><Badge value={r.status} /></td>
                </tr>
              ))}
              {!loading && shown.length === 0 && <EmptyRow cols={6} text="No attendance records" />}
            </tbody>
          </table>
        </div>

        {!loading && shown.length > PAGE_SIZE && (
          <div className="border-t border-slate-100 p-4">
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={shown.length}
              onChange={(n) => setPage(n)} />
          </div>
        )}
      </Card>
    </div>
  );
}
