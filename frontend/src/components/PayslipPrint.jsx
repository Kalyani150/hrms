import { createPortal } from "react-dom";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const fullDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

// Print-only payslip. It is hidden on screen (see index.css) and is the only
// thing shown when the browser prints while body has the "printing-payslip" class.
export default function PayslipPrint({ slip }) {
  if (!slip) return null;
  const emp = slip.employee || {};

  const earnings = [
    ["Basic salary", slip.basic],
    ["Bonus", slip.bonus]
  ];

  return createPortal(
    <div id="payslip-print" className="mx-auto max-w-2xl bg-white p-8 text-slate-900">
      <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold">HRMS</h1>
          <p className="text-sm text-slate-600">Human Resource Management System</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold uppercase tracking-wide">Payslip</p>
          <p className="text-sm text-slate-600">{monthLabel(slip.month)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <p><span className="text-slate-500">Employee: </span><b>{emp.name}</b></p>
        <p><span className="text-slate-500">Employee ID: </span>EMP-{String(emp._id || "").slice(-6).toUpperCase()}</p>
        <p><span className="text-slate-500">Department: </span>{emp.department || "—"}</p>
        <p><span className="text-slate-500">Designation: </span>{emp.designation || "—"}</p>
        <p><span className="text-slate-500">Email: </span>{emp.email || "—"}</p>
        <p><span className="text-slate-500">Pay period: </span>{monthLabel(slip.month)}</p>
      </div>

      <table className="mt-6 w-full border border-slate-300 text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border-b border-slate-300 p-3">Earnings</th>
            <th className="border-b border-slate-300 p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map(([label, value]) => (
            <tr key={label}>
              <td className="border-b border-slate-200 p-3">{label}</td>
              <td className="border-b border-slate-200 p-3 text-right">{money(value)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold">
            <td className="border-b border-slate-300 p-3">Gross earnings</td>
            <td className="border-b border-slate-300 p-3 text-right">{money(slip.basic + slip.bonus)}</td>
          </tr>
        </tbody>
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="border-b border-slate-300 p-3">Deductions</th>
            <th className="border-b border-slate-300 p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-b border-slate-300 p-3">Total deductions</td>
            <td className="border-b border-slate-300 p-3 text-right">− {money(slip.deductions)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between rounded border-2 border-slate-800 p-4">
        <span className="text-base font-semibold">Net salary payable</span>
        <span className="text-2xl font-bold">{money(slip.netSalary)}</span>
      </div>

      <div className="mt-5 flex justify-between text-sm text-slate-600">
        <p>Status: <b className="text-slate-900">{slip.status}</b></p>
        <p>{slip.status === "Paid" ? `Paid on ${fullDate(slip.paidAt)}` : "Payment pending"}</p>
      </div>

      <p className="mt-10 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">
        This is a system-generated payslip and does not require a signature.
        Printed on {fullDate(new Date())}.
      </p>
    </div>,
    document.body
  );
}
