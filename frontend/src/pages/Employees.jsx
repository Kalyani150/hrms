import { useEffect, useRef, useState } from "react";
import {
  Search, Plus, Pencil, UserX, Users, UserCheck, UserMinus, Building2,
  LayoutGrid, List, Mail, Phone, MapPin, CalendarDays
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, SkeletonCards, Modal, StatCard,
  inputCls, btnPrimary, btnGhost, th, td
} from "../components/ui";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import {
  validateName, validateEmail, validatePhone, validatePassword, validateText,
  validateSalary, validateDate, validateAddress, sanitizeName, sanitizePhone,
  sanitizeEmail, normalizePhone, isValid, ALLOW_NAME_KEY, ALLOW_PHONE_KEY,
  ALLOW_EMAIL_KEY, EMAIL_RULES_HINT, ALLOW_TEXT_KEY, sanitizeText
} from "../utils/validation";

const empty = {
  name: "", email: "", password: "",
  department: "", designation: "", salary: "",
  joiningDate: "", status: "Active", phone: "", address: ""
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("");
  const [view, setView] = useState("cards");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const departmentRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get("/employees");
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorters = {
    "": () => 0,
    "name-asc": (a, b) => a.name.localeCompare(b.name),
    "name-desc": (a, b) => b.name.localeCompare(a.name),
    "joined-new": (a, b) => new Date(b.joiningDate) - new Date(a.joiningDate),
    "joined-old": (a, b) => new Date(a.joiningDate) - new Date(b.joiningDate),
    "salary-asc": (a, b) => a.salary - b.salary,
    "salary-desc": (a, b) => b.salary - a.salary,
    "dept-asc": (a, b) => (a.department || "").localeCompare(b.department || "")
  };

  const filtered = employees.filter((e) => {
    const query = search.trim().toLowerCase();
    return (
      (!query ||
        [e.name, e.email, e.department, e.designation, e.phone]
          .some((v) => (v || "").toLowerCase().includes(query))) &&
      (!department || e.department === department) &&
      (!status || e.status === status)
    );
  }).sort(sorters[sort] || sorters[""]);

  // Field errors for the Add / Edit form ("" = valid)
  const errors = {
    name: validateName(form.name),
    email: validateEmail(form.email),
    phone: validatePhone(form.phone),
    department: validateText(form.department, "Department"),
    designation: validateText(form.designation, "Designation"),
    salary: validateSalary(form.salary),
    joiningDate: validateDate(form.joiningDate, "Joining date"),
    address: validateAddress(form.address || ""),
    ...(editing ? {} : { password: validatePassword(form.password) })
  };
  const formValid = isValid(errors);

  const save = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone,
        department: form.department.trim(),
        designation: form.designation.trim(),
        salary: Number(form.salary),
        joiningDate: form.joiningDate,
        address: (form.address || "").trim(),
        status: form.status
      };

      if (editing) {
        await api.put(`/employees/${editing}`, payload);
      } else {
        await api.post("/employees", { ...payload, password: form.password });
      }

      toast.success("Employee saved");
      setModal(false);
      setForm(empty);
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Save failed");
    }
  };

  const deactivate = async (id) => {
    if (!window.confirm("Deactivate employee?")) return;
    try {
      await api.patch(`/employees/${id}/deactivate`);
      toast.success("Employee deactivated");
      load();
    } catch {
      toast.error("Unable to deactivate employee");
    }
  };

  const reactivate = async (id) => {
    try {
      await api.patch(`/employees/${id}/reactivate`);
      toast.success("Employee reactivated");
      load();
    } catch {
      toast.error("Unable to reactivate employee");
    }
  };

  const openAdd = () => {
    setForm(empty);
    setEditing(null);
    setModal(true);
  };

  const openEdit = (emp) => {
    setEditing(emp._id);
    setForm({
      ...emp,
      phone: normalizePhone(emp.phone),
      address: emp.address || "",
      joiningDate: emp.joiningDate?.slice(0, 10) || "",
      password: ""
    });
    setModal(true);
  };

  const active = employees.filter((e) => e.status === "Active").length;
  const departments = [...new Set(employees.map((e) => e.department).filter(Boolean))];
  const payroll = employees.filter((e) => e.status === "Active")
    .reduce((t, e) => t + e.salary, 0);

  const actionButtons = (emp) => (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => openEdit(emp)} aria-label="Edit" title="Edit"
        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs
        font-medium text-blue-700 hover:bg-blue-100 sm:px-3">
        <Pencil size={13} /> <span className="hidden sm:inline">Edit</span>
      </button>
      {emp.status === "Inactive" ? (
        <button onClick={() => reactivate(emp._id)} aria-label="Reactivate" title="Reactivate"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs
          font-medium text-emerald-700 hover:bg-emerald-100 sm:px-3">
          <UserCheck size={13} /> <span className="hidden sm:inline">Reactivate</span>
        </button>
      ) : (
        <button onClick={() => deactivate(emp._id)} aria-label="Deactivate" title="Deactivate"
          className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs
          font-medium text-rose-700 hover:bg-rose-100 sm:px-3">
          <UserX size={13} /> <span className="hidden sm:inline">Deactivate</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="Manage your team, roles and contact details">
        <button onClick={openAdd} className={btnPrimary}>
          <Plus size={18} /> Add Employee
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Employees" value={employees.length} Icon={Users} tone="blue"
          hint="Click to show everyone"
          active={!status && !department && !search}
          onClick={() => { setStatus(""); setDepartment(""); setSearch(""); }} />
        <StatCard label="Active" value={active} Icon={UserCheck} tone="green"
          hint={`Monthly payroll ₹${payroll.toLocaleString("en-IN")}`}
          active={status === "Active"}
          onClick={() => setStatus(status === "Active" ? "" : "Active")} />
        <StatCard label="Inactive" value={employees.length - active} Icon={UserMinus} tone="rose"
          hint="Click to show deactivated"
          active={status === "Inactive"}
          onClick={() => setStatus(status === "Inactive" ? "" : "Inactive")} />
        <StatCard label="Departments" value={departments.length} Icon={Building2} tone="violet"
          hint={departments.slice(0, 3).join(" · ") || "—"}
          active={!!department}
          onClick={() => {
            departmentRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            departmentRef.current?.focus();
          }} />
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input placeholder="Search name, email, phone, department or role"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} cursor-pointer pl-11`} />
        </div>

        <select ref={departmentRef} value={department}
          onChange={(e) => setDepartment(e.target.value)} className={inputCls}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}>
          <option value="">Default Sort (newest added)</option>
          <option value="name-asc">Name A → Z</option>
          <option value="name-desc">Name Z → A</option>
          <option value="joined-new">Joined: newest first</option>
          <option value="joined-old">Joined: oldest first</option>
          <option value="salary-asc">Salary: low to high</option>
          <option value="salary-desc">Salary: high to low</option>
          <option value="dept-asc">Department A → Z</option>
        </select>

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
            <SkeletonCards count={8} height="h-80" />
          </div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((emp) => (
              <Card key={emp._id}
                className="cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => openEdit(emp)}>
                <div className="h-20 bg-linear-to-r from-blue-500 via-indigo-500 to-violet-500" />
                <div className="px-4 pb-5 sm:px-5">
                  <div className="-mt-9 flex flex-wrap items-end justify-between gap-2">
                    <span className="rounded-full ring-4 ring-white">
                      <Avatar name={emp.name} size="h-16 w-16 text-lg" />
                    </span>
                    <Badge value={emp.status} />
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-800">{emp.name}</h3>
                  <p className="text-sm text-slate-500">{emp.designation || "—"}</p>
                  <span className="mt-2 inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {emp.department || "No department"}
                  </span>

                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2.5"><Mail size={15} className="text-slate-400" />
                      <span className="truncate">{emp.email}</span></li>
                    <li className="flex items-center gap-2.5"><Phone size={15} className="text-slate-400" />
                      {emp.phone || <span className="text-slate-300">Not added</span>}</li>
                    <li className="flex items-center gap-2.5"><MapPin size={15} className="shrink-0 text-slate-400" />
                      <span className="truncate" title={emp.address}>
                        {emp.address || <span className="text-slate-300">Not added</span>}</span></li>
                    <li className="flex items-center gap-2.5"><CalendarDays size={15} className="text-slate-400" />
                      Joined {fmtDate(emp.joiningDate)}</li>
                  </ul>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Salary</p>
                      <p className="font-bold text-slate-800">₹{emp.salary.toLocaleString("en-IN")}</p>
                    </div>
                    {actionButtons(emp)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-14 text-center text-sm text-slate-400">No employees found</Card>
        )
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Employee", "Contact", "Department", "Designation", "Salary", "Status", "Actions"].map((h) =>
                    <th key={h} className={th}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? <SkeletonRows cols={7} /> : filtered.map((emp) => (
                  <tr key={emp._id} className="transition hover:bg-slate-50/70">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.name} />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} max-w-[220px]`}>
                      <p>{emp.phone || <span className="text-slate-300">—</span>}</p>
                      {emp.address && (
                        <p className="truncate text-xs text-slate-500" title={emp.address}>{emp.address}</p>
                      )}
                    </td>
                    <td className={td}>
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        {emp.department}
                      </span>
                    </td>
                    <td className={td}>{emp.designation}</td>
                    <td className={`${td} font-semibold text-slate-800`}>₹{emp.salary.toLocaleString("en-IN")}</td>
                    <td className={td}><Badge value={emp.status} /></td>
                    <td className={td}>{actionButtons(emp)}</td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <EmptyRow cols={7} text="No employees found" />}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {modal && (
        <Modal title={editing ? "Edit Employee" : "Add Employee"} onClose={() => setModal(false)}>
          <form onSubmit={save} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full Name" value={form.name} error={errors.name}
                onChange={(v) => setForm({ ...form, name: v })}
                sanitize={sanitizeName} allow={ALLOW_NAME_KEY} noDoubleSpace
                maxLength={50} placeholder="e.g. John Smith" />

              <FormField label="Email" type="email" value={form.email} error={errors.email}
                onChange={(v) => setForm({ ...form, email: v })}
                sanitize={sanitizeEmail} allow={ALLOW_EMAIL_KEY}
                placeholder="name@gmail.com" hint={EMAIL_RULES_HINT} />

              <FormField label="Phone (optional)" type="tel" inputMode="numeric"
                value={form.phone} error={errors.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                sanitize={sanitizePhone} allow={ALLOW_PHONE_KEY}
                maxLength={10} placeholder="10 digits" />

              <FormField label="Department" value={form.department} error={errors.department}
                onChange={(v) => setForm({ ...form, department: v })}
                sanitize={sanitizeText} allow={ALLOW_TEXT_KEY} noDoubleSpace maxLength={50}
                placeholder="e.g. Human Resources" />

              <FormField label="Designation" value={form.designation} error={errors.designation}
                onChange={(v) => setForm({ ...form, designation: v })}
                sanitize={sanitizeText} allow={ALLOW_TEXT_KEY} noDoubleSpace maxLength={50}
                placeholder="e.g. Software Engineer" />

              <FormField label="Salary" type="number" min="0" value={form.salary}
                error={errors.salary}
                onChange={(v) => setForm({ ...form, salary: v })} />

              <FormField label="Joining Date" type="date" value={form.joiningDate}
                error={errors.joiningDate}
                onChange={(v) => setForm({ ...form, joiningDate: v })} />

              <div className="sm:col-span-2">
                <FormField label="Address (optional)" as="textarea" rows={2} maxLength={300}
                  value={form.address || ""} error={errors.address}
                  onChange={(v) => setForm({ ...form, address: v })} />
              </div>
            </div>

            {!editing && (
              <PasswordField label="Initial Password" showRules value={form.password}
                error={errors.password} autoComplete="new-password"
                onChange={(v) => setForm({ ...form, password: v })} />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className={btnGhost}>Cancel</button>
              <button disabled={!formValid} className={btnPrimary}>Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
