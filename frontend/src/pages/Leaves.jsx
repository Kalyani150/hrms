import { useEffect, useState } from "react";
import { Plus, Check, X, Hourglass, CircleCheck, CircleX, CalendarRange } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, Field, Modal, StatCard,
  inputCls, btnPrimary, btnGhost, th, td
} from "../components/ui";
import FormField from "../components/FormField";
import {
  validateDate, validateEndDate, validateReason, sanitizeReason, ALLOW_REASON_KEY, isValid
} from "../utils/validation";

const blank = { type: "Sick Leave", startDate: "", endDate: "", reason: "" };
const tabs = ["All", "Pending", "Approved", "Rejected"];

const typeTone = {
  "Sick Leave": "bg-rose-50 text-rose-700",
  "Casual Leave": "bg-blue-50 text-blue-700",
  "Annual Leave": "bg-emerald-50 text-emerald-700",
  Other: "bg-slate-100 text-slate-700"
};

const days = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

const fmt = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function Leaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get("/leaves");
      setLeaves(data);
    } catch {
      toast.error("Unable to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const errors = {
    startDate: validateDate(form.startDate, "Start date"),
    endDate: validateEndDate(form.startDate, form.endDate),
    reason: validateReason(form.reason)
  };
  const formValid = isValid(errors);

  const submit = async (e) => {
    e.preventDefault();
    if (!formValid) return;

    try {
      await api.post("/leaves", { ...form, reason: form.reason.trim() });
      toast.success("Leave submitted");
      setShowForm(false);
      setForm(blank);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    }
  };

  const update = async (id, status) => {
    try {
      await api.patch(`/leaves/${id}/status`, { status });
      toast.success(`Leave ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error("Unable to update leave");
    }
  };

  const count = (s) => leaves.filter((l) => l.status === s).length;
  const approvedDays = leaves
    .filter((l) => l.status === "Approved")
    .reduce((t, l) => t + days(l.startDate, l.endDate), 0);

  const shown = filter === "All" ? leaves : leaves.filter((l) => l.status === filter);
  const tabCount = (t) => (t === "All" ? leaves.length : count(t));

  return (
    <div className="space-y-6">
      <PageHeader title="Leave Management"
        subtitle={user.role === "Admin"
          ? "Review and approve leave requests"
          : "Apply for leave and track your requests"}>
        {user.role === "Employee" && (
          <button onClick={() => setShowForm(true)} className={btnPrimary}>
            <Plus size={18} /> Apply Leave
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Pending" value={count("Pending")} Icon={Hourglass} tone="amber"
          hint={user.role === "Admin" ? "Waiting for your review" : "Waiting for approval"} />
        <StatCard label="Approved" value={count("Approved")} Icon={CircleCheck} tone="green"
          hint={`${approvedDays} day${approvedDays === 1 ? "" : "s"} in total`} />
        <StatCard label="Rejected" value={count("Rejected")} Icon={CircleX} tone="rose"
          hint="Declined requests" />
        <StatCard label="All Requests" value={leaves.length} Icon={CalendarRange} tone="blue"
          hint="Every request so far" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
          {tabs.map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === t
                  ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {t} <span className="ml-1 opacity-70">{tabCount(t)}</span>
            </button>
          ))}
        </div>

        {/* scrolls sideways inside the card on small screens */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] sm:min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Employee", "Type", "Duration", "Reason", "Status", "Actions"].map((h) =>
                  <th key={h} className={`${th} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-3.5!`}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? <SkeletonRows cols={6} /> : shown.map((l) => (
                <tr key={l._id} className="transition hover:bg-slate-50/70">
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={l.employee?.name} size="h-8 w-8 text-[11px] sm:h-9 sm:w-9 sm:text-xs" />
                      <div>
                        <p className="font-medium text-slate-800">{l.employee?.name}</p>
                        {l.employee?.department && (
                          <p className="text-xs text-slate-500">{l.employee.department}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${typeTone[l.type] || typeTone.Other}`}>
                      {l.type}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    <p className="font-medium text-slate-800">
                      {l.startDate === l.endDate ? fmt(l.startDate) : `${fmt(l.startDate)} → ${fmt(l.endDate)}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {days(l.startDate, l.endDate)} day{days(l.startDate, l.endDate) === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className={`${td} max-w-[180px] px-3! py-3! sm:max-w-[260px] sm:px-5! sm:py-4!`}>
                    <p className="truncate" title={l.reason}>{l.reason}</p>
                  </td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}><Badge value={l.status} /></td>
                  <td className={`${td} whitespace-nowrap px-3! py-3! sm:px-5! sm:py-4!`}>
                    {user.role === "Admin" && l.status === "Pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => update(l._id, "Approved")}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5
                          text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                          <Check size={14} /> Approve
                        </button>
                        <button onClick={() => update(l._id, "Rejected")}
                          className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5
                          text-xs font-medium text-rose-700 hover:bg-rose-100">
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {!loading && shown.length === 0 && <EmptyRow cols={6} text="No leave requests found" />}
            </tbody>
          </table>
        </div>
      </Card>

      {showForm && (
        <Modal title="Apply Leave" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field label="Leave type">
              <select value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={inputCls}>
                {["Sick Leave", "Casual Leave", "Annual Leave", "Other"].map((t) =>
                  <option key={t}>{t}</option>
                )}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Start date" type="date" value={form.startDate}
                error={errors.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })} />
              <FormField label="End date" type="date" min={form.startDate} value={form.endDate}
                error={errors.endDate}
                onChange={(v) => setForm({ ...form, endDate: v })} />
            </div>

            <FormField label="Reason" as="textarea" rows={4} maxLength={500}
              sanitize={sanitizeReason} allow={ALLOW_REASON_KEY} noDoubleSpace
              placeholder="Reason for leave (at least 10 characters)"
              hint="Letters, numbers, spaces and . , ! ? ' - / & ( ) : only"
              value={form.reason} error={errors.reason}
              onChange={(v) => setForm({ ...form, reason: v })} />

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={btnGhost}>Cancel</button>
              <button disabled={!formValid} className={btnPrimary}>Submit</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
