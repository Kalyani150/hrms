import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import PasswordField from "../../components/PasswordField";
import { btnPrimary } from "../../components/ui";
import {
  validateEmail, sanitizeEmail, isValid, ALLOW_EMAIL_KEY
} from "../../utils/validation";

// One page, two sign-ins: /login is for employees, /admin/login is for administrators
export default function Login({ portal = "employee" }) {
  const isAdmin = portal === "admin";
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    email: validateEmail(email),
    // Only "not empty": the strength rules apply when a password is created, not when signing in,
    // so accounts with older passwords can still log in
    password: password ? "" : "Password is required"
  };
  const formValid = isValid(errors);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!formValid) return;
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password, portal);
      toast.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isAdmin ? "Admin sign in" : "Employee sign in"}
      subtitle={isAdmin ? "Sign in with your administrator account" : "Sign in to your employee account to continue"}
      footer={isAdmin
        ? <>Not an admin? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Employee sign in</Link></>
        : <>
            <span className="block">New here? <Link to="/register" className="font-semibold text-blue-600 hover:underline">Create an account</Link></span>
            <span className="mt-2 block">Administrator? <Link to="/admin/login" className="font-semibold text-blue-600 hover:underline">Admin sign in</Link></span>
          </>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormField label="Email" type="email" value={email} onChange={setEmail}
          error={errors.email} forceShow={submitted} maxLength={254} sanitize={sanitizeEmail} allow={ALLOW_EMAIL_KEY} autoComplete="email"
          placeholder={isAdmin ? "admin@company.com" : "you@company.com"} leftIcon={<Mail size={18} />} />

        <div>
          <PasswordField label="Password" value={password} onChange={setPassword}
            error={errors.password} forceShow={submitted} autoComplete="current-password"
            allow={null} sanitize={null} placeholder="Enter your password" />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <button disabled={loading} className={`${btnPrimary} w-full py-3.5`}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
