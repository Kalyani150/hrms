import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import AuthLayout from "../../components/AuthLayout";
import PasswordField from "../../components/PasswordField";
import { btnPrimary } from "../../components/ui";
import { validatePassword, validateConfirm, isValid } from "../../utils/validation";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
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
      const { data } = await api.post("/auth/reset-password", { token, password });
      toast.success(data.message);
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reset the password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Choose a new password" subtitle="Pick a strong password you have not used before"
      footer={<Link to="/login" className="font-semibold text-blue-600 hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} noValidate className="space-y-5">
        <PasswordField label="New password" showRules value={password} onChange={setPassword}
          error={errors.password} forceShow={submitted} autoComplete="new-password" placeholder="Create a password" />

        <PasswordField label="Confirm password" value={confirm} onChange={setConfirm}
          error={errors.confirm} forceShow={submitted} autoComplete="new-password" placeholder="Re-enter your password" />

        <button disabled={loading} className={`${btnPrimary} w-full py-3.5`}>
          {loading ? "Saving..." : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}
