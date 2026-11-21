import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Users, CalendarCheck, Wallet, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import FormField from "../components/FormField";
import {
  validateEmail, validateRequired, sanitizeEmail, isValid, ALLOW_EMAIL_KEY
} from "../utils/validation";

const features = [
  [Users, "Employee records in one place"],
  [CalendarCheck, "Attendance and leave tracking"],
  [Wallet, "Simple, accurate payroll"]
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sign-in only needs a password to be entered; the strength rules apply when one is created
  const errors = {
    email: validateEmail(email),
    password: validateRequired(password, "Password")
  };
  const formValid = isValid(errors);

  const submit = async (e) => {
    e.preventDefault();
    if (!formValid) return;
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-linear-to-br
        from-blue-600 via-indigo-600 to-violet-700 p-12 text-white lg:flex
        lg:flex-col lg:justify-between">
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

      {/* Form */}
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={submit} noValidate
          className="w-full max-w-md space-y-6 rounded-3xl bg-white p-8
          shadow-xl ring-1 ring-slate-100 sm:p-10">
          <div>
            <div className="mb-5 flex items-center gap-2 lg:hidden">
              <span className="rounded-xl bg-blue-600 p-2 text-white"><Building2 size={20} /></span>
              <span className="text-xl font-bold text-slate-800">HRMS</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          <FormField label="Email" type="email" value={email} onChange={setEmail}
            error={errors.email} sanitize={sanitizeEmail} allow={ALLOW_EMAIL_KEY} autoComplete="email"
            placeholder="you@company.com" leftIcon={<Mail size={18} />} />

          <FormField label="Password" type={show ? "text" : "password"} value={password}
            onChange={setPassword} error={errors.password} autoComplete="current-password"
            placeholder="Enter your password" leftIcon={<Lock size={18} />}
            rightSlot={
              <button type="button" onClick={() => setShow(!show)}
                aria-label={show ? "Hide password" : "Show password"}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            } />

          <button disabled={loading || !formValid}
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-indigo-600
            py-3.5 font-semibold text-white shadow-md transition hover:shadow-lg
            hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
