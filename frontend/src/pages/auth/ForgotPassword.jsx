import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../components/AuthLayout";
import FormField from "../../components/FormField";
import { btnPrimary } from "../../components/ui";
import { validateEmail, sanitizeEmail, ALLOW_EMAIL_KEY } from "../../utils/validation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const error = validateEmail(email);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (error) return;
    setLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send the reset link");
    } finally {
      setLoading(false);
    }
  };

  const back = <Link to="/login" className="font-semibold text-blue-600 hover:underline">Back to sign in</Link>;

  if (result) {
    return (
      <AuthLayout title="Check your email" subtitle={result.message} footer={back}>
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          <MailCheck size={20} className="shrink-0" />
          The link is valid for 15 minutes.
        </div>

        {/* Only returned by the API in development when no email server is configured */}
        {result.devResetLink && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Development mode: email is not configured.</p>
            <a href={result.devResetLink} className="mt-1 block break-all font-medium underline">
              Open the reset link
            </a>
          </div>
        )}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to reset it" footer={back}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <FormField label="Email" type="email" value={email} onChange={setEmail} error={error} forceShow={submitted} maxLength={254}
          sanitize={sanitizeEmail} allow={ALLOW_EMAIL_KEY} autoComplete="email"
          placeholder="you@company.com" leftIcon={<Mail size={18} />} />

        <button disabled={loading} className={`${btnPrimary} w-full py-3.5`}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthLayout>
  );
}
