import { useEffect, useState } from "react";
import { Plus, Hourglass, CircleCheck, CircleX, CalendarRange } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, Field, Modal, StatCard,
  DataTable, ExpandableText, CardRow, inputCls, btnPrimary, btnGhost, cell
} from "../components/ui";
import FormField from "../components/FormField";
import {
  validateStartDate, validateEndDate, validateReason, sanitizeReason, todayKey, ALLOW_REASON_KEY, isValid
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

  const today = todayKey(); // earliest date that can be picked
  const errors = {
    startDate: validateStartDate(form.startDate),
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
          ? "All leave requests from employees"
          : "Apply for leave and track your requests"}>
        {user.role === "Employee" && (
          <button onClick={() => setShowForm(true)} className={btnPrimary}>
            <Plus size={18} /> Apply Leave
          </button>
        )}
      </PageHeader>

      <CardRow className="min-[400px]:grid-cols-2 @2xl:grid-cols-4">
        <StatCard label="Pending" value={count("Pending")} Icon={Hourglass} tone="amber"
          hint="Waiting for approval" />
        <StatCard label="Approved" value={count("Approved")} Icon={CircleCheck} tone="green"
          hint={`${approvedDays} day${approvedDays === 1 ? "" : "s"} in total`} />
        <StatCard label="Rejected" value={count("Rejected")} Icon={CircleX} tone="rose"
          hint="Declined requests" />
        <StatCard label="All Requests" value={leaves.length} Icon={CalendarRange} tone="blue"
          hint="Every request so far" />
      </CardRow>

      <Card className="overflow-hidden">
        {/* phones: an even 2 x 2 block instead of one button left over on a second line */}
        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 p-3 sm:flex sm:flex-wrap sm:p-4">
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

        {/* same table on every screen size; it scrolls sideways inside the card on small screens */}
        {/* on phones long names are cut to one line, so rows are the same height and columns stay compact */}
        <DataTable className="min-w-[640px] sm:min-w-[720px]"
          columns={["Employee", "Type", "Duration", "Reason", "Status"]}>
          {loading ? <SkeletonRows cols={5} /> : shown.map((l) => (
            <tr key={l._id} className="transition hover:bg-slate-50/70">
              <td className={cell}>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Avatar name={l.employee?.name} size="h-8 w-8 text-[11px] sm:h-9 sm:w-9 sm:text-xs" />
                  <div className="max-sm:w-32 max-sm:*:truncate sm:min-w-32">
                    <p className="font-medium text-slate-800">{l.employee?.name}</p>
                    {l.employee?.department && (
                      <p className="text-xs text-slate-500">{l.employee.department}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className={`${cell} whitespace-nowrap`}>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${typeTone[l.type] || typeTone.Other}`}>
                  {l.type}
                </span>
              </td>
              <td className={`${cell} whitespace-nowrap`}>
                <div>
                  <p className="font-medium text-slate-800">
                    {l.startDate === l.endDate ? fmt(l.startDate) : `${fmt(l.startDate)} → ${fmt(l.endDate)}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {days(l.startDate, l.endDate)} day{days(l.startDate, l.endDate) === 1 ? "" : "s"}
                  </p>
                </div>
              </td>
              <td className={`${cell} sm:w-1/3`}>
                <ExpandableText text={l.reason} empty="No reason provided" className="min-w-40 sm:min-w-48" />
              </td>
              <td className={cell}><Badge value={l.status} /></td>
            </tr>
          ))}
          {!loading && shown.length === 0 && <EmptyRow cols={5} text="No leave requests found" />}
        </DataTable>
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
              <FormField label="Start date" type="date" min={today} value={form.startDate}
                error={errors.startDate}
                onChange={(v) => setForm({ ...form, startDate: v })} />
              <FormField label="End date" type="date" value={form.endDate}
                min={form.startDate > today ? form.startDate : today}
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
