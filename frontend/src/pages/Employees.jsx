import { useEffect, useState } from "react";
import {
  Search, Plus, Pencil, UserX, Users, UserCheck, UserMinus, Building2,
  LayoutGrid, List, Mail, Phone, MapPin, CalendarDays
} from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  PageHeader, Card, Avatar, Badge, EmptyRow, SkeletonRows, SkeletonCards, Modal, StatCard, Pagination,
  ResponsiveTable, ExpandableText, CardRow, inputCls, btnPrimary, btnGhost, cell
} from "../components/ui";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import {
  validateName, validateEmail, validatePhone, validatePassword, validateText,
  validateSalary, validateDate, validateAddress, sanitizeName, sanitizePhone,
  sanitizeEmail, normalizePhone, isValid, ALLOW_NAME_KEY, ALLOW_PHONE_KEY,
  ALLOW_EMAIL_KEY, EMAIL_RULES_HINT, ALLOW_TEXT_KEY, sanitizeText
} from "../utils/validation";

// Choices in the Add / Edit form's Department dropdown (departments already in use are added too)
const DEFAULT_DEPARTMENTS = [
  "Human Resources", "Engineering", "Finance", "Sales", "Marketing",
  "Operations", "IT Support", "Customer Support", "Administration"
];

const PAGE_SIZE = 4; // employees per page

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
  const [salaryFilter, setSalaryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState("cards");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const matching = employees.filter((e) => {
    const query = search.trim().toLowerCase();
    return (
      (!query ||
        [e.name, e.email, e.department, e.designation, e.phone]
          .some((v) => (v || "").toLowerCase().includes(query))) &&
      (!department || e.department === department) &&
      (!status || e.status === status)
    );
  });

  // "Lowest" / "Highest" keep only the employee(s) with the lowest / highest salary in the current results
  const salaries = matching.map((e) => e.salary);
  const target = salaryFilter === "lowest" ? Math.min(...salaries)
    : salaryFilter === "highest" ? Math.max(...salaries) : null;
  const filtered = target === null ? matching : matching.filter((e) => e.salary === target);

  // Only one page of employees is drawn at a time (page is clamped if the list shrinks, e.g. after a deactivate)
  const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const goToPage = (n) => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

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
  const departmentOptions = [...new Set([...DEFAULT_DEPARTMENTS, ...departments])].sort();
  const payroll = employees.filter((e) => e.status === "Active")
    .reduce((t, e) => t + e.salary, 0);

  const actionButtons = (emp) => (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => openEdit(emp)} aria-label="Edit" title="Edit"
        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs
        font-medium text-blue-700 hover:bg-blue-100 sm:px-3">
        <Pencil size={13} /> <span>Edit</span>
      </button>
      {emp.status === "Inactive" ? (
        <button onClick={() => reactivate(emp._id)} aria-label="Reactivate" title="Reactivate"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs
          font-medium text-emerald-700 hover:bg-emerald-100 sm:px-3">
          <UserCheck size={13} /> <span>Reactivate</span>
        </button>
      ) : (
        <button onClick={() => deactivate(emp._id)} aria-label="Deactivate" title="Deactivate"
          className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs
          font-medium text-rose-700 hover:bg-rose-100 sm:px-3">
          <UserX size={13} /> <span>Deactivate</span>
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

      <CardRow className="min-[320px]:grid-cols-2 @2xl:grid-cols-4">
        <StatCard label="Total Employees" value={employees.length} Icon={Users} tone="blue"
          hint="Everyone on the team" />
        <StatCard label="Active" value={active} Icon={UserCheck} tone="green"
          hint={`Monthly payroll ₹${payroll.toLocaleString("en-IN")}`} />
        <StatCard label="Inactive" value={employees.length - active} Icon={UserMinus} tone="rose"
          hint="Deactivated accounts" />
        <StatCard label="Departments" value={departments.length} Icon={Building2} tone="violet"
          hint={departments.slice(0, 3).join(" · ") || "—"} />
      </CardRow>

      <Card className="grid grid-cols-2 gap-3 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <div className="relative col-span-2 min-w-0 md:col-span-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input placeholder="Search employees" title="Search by name, email, phone, department or role"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className={`${inputCls} cursor-pointer pl-11`} />
        </div>

        <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }} className={`${inputCls} min-w-0`}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>

        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${inputCls} min-w-0`}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <select value={salaryFilter} onChange={(e) => { setSalaryFilter(e.target.value); setPage(1); }} className={`${inputCls} min-w-0`}>
          <option value="">All Salaries</option>
          <option value="lowest">Lowest salary</option>
          <option value="highest">Highest salary</option>
        </select>

        <div className="flex w-fit self-center justify-self-end rounded-xl bg-slate-100 p-0.5 md:p-1">
          {[["cards", LayoutGrid], ["table", List]].map(([key, Icon]) => (
            <button key={key} onClick={() => setView(key)} title={`${key} view`}
              className={`rounded-lg px-2.5 py-1.5 transition md:px-3 md:py-2 ${
                view === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
              }`}>
              <Icon size={18} />
            </button>
          ))}
        </div>
      </Card>

      {view === "cards" ? (
        loading ? (
          <CardRow className="min-[400px]:grid-cols-2 @4xl:grid-cols-4">
            <SkeletonCards count={8} height="h-80" />
          </CardRow>
        ) : filtered.length ? (
          <CardRow className="min-[400px]:grid-cols-2 @4xl:grid-cols-4">
            {visible.map((emp) => (
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
          </CardRow>
        ) : (
          <Card className="p-14 text-center text-sm text-slate-400">No employees found</Card>
        )
      ) : (
        <Card className="overflow-hidden">
          {/* a table when there is room, one card per employee on smaller screens */}
          <ResponsiveTable stackBelow={960}
            columns={["Employee", "Contact", "Department", "Designation", "Salary", "Status", "Actions"]}>
            {loading ? <SkeletonRows cols={7} /> : visible.map((emp) => (
              <tr key={emp._id} className="transition hover:bg-slate-50/70">
                <td className={cell}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={emp.name} size="h-9 w-9 text-xs" />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{emp.name}</p>
                      <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">{emp.email}</p>
                    </div>
                  </div>
                </td>
                <td className={cell} data-label="Contact">
                  <div>
                    <p>{emp.phone || <span className="text-slate-300">—</span>}</p>
                    {emp.address && (
                      <ExpandableText text={emp.address} className="text-xs text-slate-500" />
                    )}
                  </div>
                </td>
                <td className={cell} data-label="Department">
                  {emp.department ? (
                    <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {emp.department}
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className={cell} data-label="Designation">
                  {emp.designation || <span className="text-slate-300">—</span>}
                </td>
                <td className={`${cell} whitespace-nowrap font-semibold`} data-label="Salary">₹{emp.salary.toLocaleString("en-IN")}</td>
                <td className={cell} data-label="Status"><Badge value={emp.status} /></td>
                <td className={cell} data-label="Actions">{actionButtons(emp)}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <EmptyRow cols={7} text="No employees found" />}
          </ResponsiveTable>
        </Card>
      )}

      {!loading && (
        <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onChange={goToPage} />
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

              <FormField label="Department" as="select" value={form.department} error={errors.department}
                onChange={(v) => setForm({ ...form, department: v })}>
                <option value="">Select department</option>
                {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              </FormField>

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
