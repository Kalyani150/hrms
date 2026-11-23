import { useEffect, useRef, useState } from "react";
import {
  Plus, BadgeCheck, Wallet, Clock, CircleCheck, PieChart, LayoutGrid, List, Users, Pencil,
  Printer
} from "lucide-react";
import PayslipPrint from "../components/PayslipPrint";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, SkeletonCards, Modal, StatCard,
  inputCls, btnPrimary, btnGhost, th, td
} from "../components/ui";
import FormField from "../components/FormField";
import {
  validateAmount, validateDeductions, validateSelect, validateMonth, isValid
} from "../utils/validation";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function Payroll() {
  const { user } = useAuth();
  const isAdmin = user.role === "Admin";
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState("cards");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "single" | "all" | "edit" | null
  const [editing, setEditing] = useState(null); // payslip being edited
  const [editForm, setEditForm] = useState({ basic: "", bonus: "", deductions: "", updateSalary: false });
  const [bulkMonth, setBulkMonth] = useState(currentMonth());
  const [months, setMonths] = useState([]);
  const [form, setForm] = useState({
    employee: "", month: currentMonth(), bonus: "0", deductions: "0"
  });
  const listRef = useRef(null);
  const [printSlip, setPrintSlip] = useState(null); // payslip being printed

  // Print the chosen payslip: show only it on paper, then restore the page
  useEffect(() => {
    if (!printSlip) return;
    document.body.classList.add("printing-payslip");
    const done = () => setPrintSlip(null);
    window.addEventListener("afterprint", done, { once: true });
    const timer = setTimeout(() => window.print(), 80);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
      document.body.classList.remove("printing-payslip");
    };
  }, [printSlip]);

  // Months that have payroll, newest first (for the month filter)
  const loadMonths = async () => {
    try {
      const { data } = await api.get("/payroll");
      setMonths([...new Set(data.map((r) => r.month))].sort().reverse());
    } catch {
      /* the filter just stays empty */
    }
  };

  useEffect(() => { loadMonths(); }, []);

  const load = async () => {
    try {
      const { data } = await api.get("/payroll", {
        params: {
          ...(month && { month }),
          ...(status && { status })
        }
      });
      setRecords(data);
    } catch {
      toast.error("Unable to load payroll");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, status]);

  useEffect(() => {
    if (isAdmin) {
      api.get("/employees")
        .then(({ data }) =>
          setEmployees(data.filter(e => e.status === "Active"))
        )
        .catch(() => toast.error("Unable to load employees"));
    }
  }, [isAdmin]);

  const selectedEmployee = employees.find((e) => e._id === form.employee);
  const singleErrors = {
    employee: validateSelect(form.employee, "an employee"),
    month: validateMonth(form.month),
    bonus: validateAmount(form.bonus, "Bonus"),
    deductions: validateDeductions(selectedEmployee?.salary, form.bonus, form.deductions)
  };
  const singleValid = isValid(singleErrors);

  const editErrors = {
    basic: validateAmount(editForm.basic, "Basic pay"),
    bonus: validateAmount(editForm.bonus, "Bonus"),
    deductions: validateDeductions(editForm.basic, editForm.bonus, editForm.deductions)
  };
  const editValid = isValid(editErrors);

  const bulkError = validateMonth(bulkMonth);

  const generate = async (e) => {
    e.preventDefault();
    if (!singleValid) return;

    try {
      await api.post("/payroll", {
        employee: form.employee,
        month: form.month,
        bonus: Number(form.bonus),
        deductions: Number(form.deductions)
      });

      toast.success("Payroll generated");
      setModal(null);
      setForm({
        employee: "", month: currentMonth(), bonus: "0", deductions: "0"
      });
      load();
      loadMonths();
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    }
  };

  const generateAll = async (e) => {
    e.preventDefault();
    if (bulkError) return;
    try {
      const { data } = await api.post("/payroll/generate", { month: bulkMonth });
      toast.success(data.message);
      setModal(null);
      setMonth(bulkMonth);
      load();
      loadMonths();
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    }
  };

  const openEdit = (r) => {
    setEditing(r);
    setEditForm({
      basic: String(r.basic),
      bonus: String(r.bonus),
      deductions: String(r.deductions),
      updateSalary: false
    });
    setModal("edit");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editValid) return;
    try {
      const { data } = await api.put(`/payroll/${editing._id}`, {
        basic: Number(editForm.basic),
        bonus: Number(editForm.bonus),
        deductions: Number(editForm.deductions),
        updateSalary: basicChanged && editForm.updateSalary
      });
      toast.success(data.salaryUpdated
        ? "Payslip and employee salary updated"
        : "Payslip updated");
      setModal(null);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update payslip");
    }
  };

  const basicChanged = !!editing && Number(editForm.basic) !== editing.basic;

  const editNet = Math.max(
    0,
    Number(editForm.basic || 0) + Number(editForm.bonus || 0) - Number(editForm.deductions || 0)
  );

  const markPaid = async (id) => {
    try {
      await api.patch(`/payroll/${id}/pay`);
      toast.success("Payroll marked as paid");
      load();
    } catch {
      toast.error("Unable to update payroll");
    }
  };

  const sum = (list) => list.reduce((t, r) => t + (r.netSalary || 0), 0);
  const paid = records.filter((r) => r.status === "Paid");
  const pending = records.filter((r) => r.status === "Pending");
  const completion = records.length ? Math.round((paid.length / records.length) * 100) : 0;

  const pick = (s) => {
    setStatus(s);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const printBtn = (r) => (
    <button onClick={() => setPrintSlip(r)}
      className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs
      font-medium text-slate-700 hover:bg-slate-200">
      <Printer size={14} /> Print
    </button>
  );

  // Admin actions for an unpaid payslip: Edit amounts, Mark Paid
  const payAction = (r) =>
    isAdmin && r.status === "Pending" && (
      <div className="flex gap-2">
        <button onClick={() => openEdit(r)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs
          font-medium text-blue-700 hover:bg-blue-100">
          <Pencil size={14} /> Edit
        </button>
        <button onClick={() => markPaid(r._id)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs
          font-medium text-emerald-700 hover:bg-emerald-100">
          <BadgeCheck size={14} /> Mark Paid
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll"
        subtitle={isAdmin ? "Generate and manage monthly payslips" : "Your monthly payslips"}>
        {isAdmin && (
          <>
            <button onClick={() => setModal("all")} className={btnGhost}>
              <Users size={17} /> Generate for all
            </button>
            <button onClick={() => setModal("single")} className={btnPrimary}>
              <Plus size={18} /> Generate Payroll
            </button>
          </>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total net payroll" value={money(sum(records))} Icon={Wallet} tone="blue"
          hint={`${records.length} payslip${records.length === 1 ? "" : "s"} · click for all`}
          active={!status} onClick={() => pick("")} />
        <StatCard label="Paid" value={money(sum(paid))} Icon={CircleCheck} tone="green"
          hint={`${paid.length} paid`} active={status === "Paid"}
          onClick={() => pick(status === "Paid" ? "" : "Paid")} />
        <StatCard label="Pending" value={money(sum(pending))} Icon={Clock} tone="amber"
          hint={`${pending.length} awaiting payment`} active={status === "Pending"}
          onClick={() => pick(status === "Pending" ? "" : "Pending")} />
        <StatCard label="Completion" value={`${completion}%`} Icon={PieChart} tone="violet"
          hint={`${paid.length} of ${records.length} paid`} />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">
            {month ? monthLabel(month) : "All months"} · payroll progress
          </span>
          <span className="font-semibold text-slate-800">{money(sum(paid))} of {money(sum(records))}</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all"
            style={{ width: `${records.length ? (sum(paid) / (sum(records) || 1)) * 100 : 0}%` }} />
        </div>
      </Card>

      <Card className="scroll-mt-24 flex flex-wrap items-center justify-between gap-3 p-4 sm:flex-nowrap" ref={listRef}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
          <select value={month} onChange={(e) => setMonth(e.target.value)}
            className={`${inputCls} w-44! shrink-0`}>
            <option value="">All months</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className={`${inputCls} w-40! shrink-0`}>
            <option value="">All Status</option>
            <option>Pending</option>
            <option>Paid</option>
          </select>
          {(month || status) && (
            <button onClick={() => { setMonth(""); setStatus(""); }}
              className="shrink-0 text-sm font-medium text-blue-600 hover:underline">Clear</button>
          )}
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1">
          {[["cards", LayoutGrid], ["table", List]].map(([key, Icon]) => (
            <button key={key} onClick={() => setView(key)} title={`${key} view`}
              className={`rounded-lg px-3 py-2 transition ${
                view === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
              }`}>
              <Icon size={18} />
            </button>
          ))}
        </div>
      </Card>

      {view === "cards" ? (
        loading ? (
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            <SkeletonCards count={8} height="h-72" />
          </div>
        ) : records.length ? (
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {records.map((r) => (
              <Card key={r._id} className="overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`p-5 text-white ${
                  r.status === "Paid"
                    ? "bg-linear-to-br from-emerald-500 to-teal-600"
                    : "bg-linear-to-br from-blue-600 to-indigo-600"
                }`}>
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>{monthLabel(r.month)}</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{r.status}</span>
                  </div>
                  <p className="mt-3 text-xs text-white/70">Net salary</p>
                  <p className="text-xl font-bold tracking-tight [overflow-wrap:anywhere] sm:text-2xl 2xl:text-3xl">{money(r.netSalary)}</p>
                </div>

                <div className="p-5">
                  {isAdmin && (
                    <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                      <Avatar name={r.employee?.name} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">{r.employee?.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[r.employee?.designation, r.employee?.department].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-slate-500">Basic</dt>
                      <dd className="font-medium text-slate-800">{money(r.basic)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Bonus</dt>
                      <dd className="font-medium text-emerald-600">+ {money(r.bonus)}</dd></div>
                    <div className="flex justify-between"><dt className="text-slate-500">Deductions</dt>
                      <dd className="font-medium text-rose-600">− {money(r.deductions)}</dd></div>
                  </dl>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {payAction(r)}
                    {printBtn(r)}
                  </div>
                  {r.status === "Paid" && r.paidAt && (
                    <p className="mt-3 text-xs text-slate-400">
                      Paid on {new Date(r.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-14 text-center text-sm text-slate-400">No payroll records</Card>
        )
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Employee", "Month", "Basic", "Bonus", "Deductions", "Net Salary", "Status", "Action"]
                    .map((h) => <th key={h} className={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <SkeletonRows cols={8} /> : records.map((r) => (
                  <tr key={r._id} className="transition hover:bg-slate-50/70">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.employee?.name} size="h-9 w-9 text-xs" />
                        <span className="font-medium text-slate-800">{r.employee?.name}</span>
                      </div>
                    </td>
                    <td className={td}>{monthLabel(r.month)}</td>
                    <td className={td}>{money(r.basic)}</td>
                    <td className={`${td} text-emerald-600`}>{r.bonus ? `+ ${money(r.bonus)}` : money(0)}</td>
                    <td className={`${td} text-rose-600`}>{r.deductions ? `− ${money(r.deductions)}` : money(0)}</td>
                    <td className={`${td} font-bold text-slate-800`}>{money(r.netSalary)}</td>
                    <td className={td}><Badge value={r.status} /></td>
                    <td className={td}>
                      <div className="flex gap-2">
                        {payAction(r)}
                        {printBtn(r)}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && records.length === 0 && <EmptyRow cols={8} text="No payroll records" />}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modal === "single" && (
        <Modal title="Generate Payroll" onClose={() => setModal(null)}>
          <form onSubmit={generate} noValidate className="space-y-4">
            <FormField label="Employee" as="select" value={form.employee} error={singleErrors.employee}
              onChange={(v) => setForm({ ...form, employee: v })}>
              <option value="">Select Employee</option>
              {employees.map((e) =>
                <option key={e._id} value={e._id}>{e.name} – {money(e.salary)}</option>
              )}
            </FormField>

            <FormField label="Month" type="month" value={form.month} error={singleErrors.month}
              onChange={(v) => setForm({ ...form, month: v })} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Bonus (₹)" type="number" min="0" step="0.01" inputMode="decimal"
                value={form.bonus} error={singleErrors.bonus}
                onChange={(v) => setForm({ ...form, bonus: v })} />
              <FormField label="Deductions (₹)" type="number" min="0" step="0.01" inputMode="decimal"
                value={form.deductions} error={singleErrors.deductions}
                onChange={(v) => setForm({ ...form, deductions: v })} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
              <button disabled={!singleValid} className={btnPrimary}>Generate</button>
            </div>
          </form>
        </Modal>
      )}

      <PayslipPrint slip={printSlip} />

      {modal === "edit" && editing && (
        <Modal title="Edit payslip" onClose={() => setModal(null)}>
          <form onSubmit={saveEdit} noValidate className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <Avatar name={editing.employee?.name} />
              <div>
                <p className="font-semibold text-slate-800">{editing.employee?.name}</p>
                <p className="text-xs text-slate-500">{monthLabel(editing.month)}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[["basic", "Basic (₹)"], ["bonus", "Bonus (₹)"], ["deductions", "Deductions (₹)"]].map(([key, label]) => (
                <FormField key={key} label={label} type="number" min="0" step="0.01" inputMode="decimal"
                  value={editForm[key]} error={editErrors[key]}
                  onChange={(v) => setEditForm({ ...editForm, [key]: v })} />
              ))}
            </div>

            {basicChanged && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200
                bg-amber-50 p-3 text-sm text-amber-900">
                <input type="checkbox" checked={editForm.updateSalary}
                  onChange={(e) => setEditForm({ ...editForm, updateSalary: e.target.checked })}
                  className="mt-0.5 h-4 w-4 accent-blue-600" />
                <span>
                  Also update {editing.employee?.name}'s monthly salary to {money(Number(editForm.basic))}
                  <span className="block text-xs text-amber-700">
                    Leave unticked to change this payslip only.
                  </span>
                </span>
              </label>
            )}

            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
              <span className="text-sm text-blue-700">New net salary</span>
              <span className="text-xl font-bold text-blue-800">{money(editNet)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
              <button disabled={!editValid} className={btnPrimary}>Save changes</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "all" && (
        <Modal title="Generate payroll for all employees" onClose={() => setModal(null)}>
          <form onSubmit={generateAll} noValidate className="space-y-4">
            <p className="text-sm text-slate-500">
              Creates a payslip for every active employee who doesn't have one yet for the
              chosen month, using their salary as basic pay. Existing payslips are skipped.
            </p>
            <FormField label="Month" type="month" value={bulkMonth} error={bulkError}
              onChange={setBulkMonth} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
              <button disabled={!!bulkError} className={btnPrimary}>Generate for all</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
