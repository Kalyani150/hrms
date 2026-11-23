import { Link } from "react-router-dom";
import { Users, CalendarCheck, Wallet, Building2 } from "lucide-react";

const features = [
  [Users, "Employee records in one place"],
  [CalendarCheck, "Attendance and leave tracking"],
  [Wallet, "Simple, accurate payroll"]
];

/** Shared shell for Login, Register, Forgot password and Reset password. */
export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-linear-to-br from-blue-600
        via-indigo-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <span className="rounded-xl bg-white/20 p-2.5"><Building2 size={26} /></span>
          <span className="text-2xl font-bold">HRMS</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Manage your people,<br />effortlessly.
          </h1>
          <p className="mt-4 max-w-md text-blue-100">
            One simple workspace for employees, attendance, leave and payroll.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span className="rounded-lg bg-white/15 p-2"><Icon size={18} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-blue-200">Human Resource Management System</p>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-4 py-8 sm:p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-100 sm:p-10">
          <Link to="/login" className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="rounded-xl bg-blue-600 p-2 text-white"><Building2 size={20} /></span>
            <span className="text-xl font-bold text-slate-800">HRMS</span>
          </Link>

          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-6">{children}</div>

          {footer && <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>}
        </div>
      </div>
    </div>
  );
}
