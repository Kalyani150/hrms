import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, User, Clock } from "lucide-react";
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [doneMessage, setDoneMessage] = useState("");

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
      setDoneMessage(await register(name.trim(), email.trim().toLowerCase(), password));
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (doneMessage) {
    return (
      <AuthLayout title="Awaiting approval" subtitle="Your registration was submitted"
        footer={<Link to="/login" className="font-semibold text-blue-600 hover:underline">Back to sign in</Link>}>
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <Clock size={20} className="mt-0.5 shrink-0" />
          <p>{doneMessage} You will be able to sign in as soon as it is approved.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" subtitle="Register as an employee. An administrator approves new accounts."
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
          {loading ? "Submitting..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
