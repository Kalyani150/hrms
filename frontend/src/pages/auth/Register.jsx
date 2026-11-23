import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import PasswordField from "../../components/PasswordField";
import { btnPrimary } from "../../components/ui";
import {
  validateName, validateEmail, validatePassword, validateConfirm, isValid,
  sanitizeName, sanitizeEmail, ALLOW_NAME_KEY, ALLOW_EMAIL_KEY
} from "../../utils/validation";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    password: validatePassword(password),
    confirm: validateConfirm(password, confirm)
  };
  const formValid = isValid(errors);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!formValid) return;
    setLoading(true);

    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Register as an employee to get started"
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormField label="Full name" value={name} onChange={setName} error={errors.name} forceShow={submitted}
          sanitize={sanitizeName} allow={ALLOW_NAME_KEY} noDoubleSpace autoComplete="name"
          placeholder="Your full name" leftIcon={<User size={18} />} />

        <FormField label="Email" type="email" value={email} onChange={setEmail}
          error={errors.email} forceShow={submitted} maxLength={254} sanitize={sanitizeEmail} allow={ALLOW_EMAIL_KEY} autoComplete="email"
          placeholder="you@company.com" leftIcon={<Mail size={18} />} />

        <PasswordField label="Password" showRules value={password} onChange={setPassword}
          error={errors.password} forceShow={submitted} autoComplete="new-password" placeholder="Create a password" />

        <PasswordField label="Confirm password" value={confirm} onChange={setConfirm}
          error={errors.confirm} forceShow={submitted} autoComplete="new-password" placeholder="Re-enter your password" />

        <button disabled={loading} className={`${btnPrimary} w-full py-3.5`}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
