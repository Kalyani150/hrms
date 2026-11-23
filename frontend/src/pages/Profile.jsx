import { useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Mail, Phone, MapPin, Building2, Briefcase, ShieldCheck, UserRound } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { PageHeader, Card, Badge, btnPrimary, btnGhost } from "../components/ui";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import {
  validateName, validatePhone, validateAddress, validateNewPassword, validateRequired,
  validateConfirm, sanitizeName, sanitizePhone, normalizePhone, isValid,
  ALLOW_NAME_KEY, ALLOW_PHONE_KEY
} from "../utils/validation";

export default function Profile() {
  const { user, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name,
    phone: normalizePhone(user.phone),
    address: user.address || ""
  });

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [changingPw, setChangingPw] = useState(false);

  const profileErrors = {
    name: validateName(form.name),
    phone: validatePhone(form.phone),
    address: validateAddress(form.address)
  };
  const profileValid = isValid(profileErrors);

  const pwErrors = {
    currentPassword: validateRequired(pw.currentPassword, "Current password"),
    newPassword: validateNewPassword(pw.newPassword, pw.currentPassword),
    confirm: validateConfirm(pw.newPassword, pw.confirm)
  };
  const pwValid = isValid(pwErrors);

  const startEdit = () => {
    setForm({
      name: user.name,
      phone: normalizePhone(user.phone),
      address: user.address || ""
    });
    setEditing(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileValid) return;
    setSaving(true);
    try {
      const { data } = await api.put("/auth/profile", {
        name: form.name.trim(),
        phone: form.phone,
        address: form.address.trim()
      });
      setUser(data.user);
      setEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pwValid) return;
    setChangingPw(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword
      });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setChangingPw(false);
    }
  };

  const details = [
    [UserRound, "Full name", user.name],
    [Mail, "Email", user.email],
    [Phone, "Phone", user.phone || "Not added"],
    [Building2, "Department", user.department || "N/A"],
    [Briefcase, "Designation", user.designation || "N/A"],
    [ShieldCheck, "Role", user.role],
    [MapPin, "Address", user.address || "Not added"]
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" subtitle="Your personal information and security" />

      {/* Banner */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-linear-to-br
        from-blue-600 via-indigo-600 to-violet-600 p-5 text-center text-white shadow-lg
        sm:flex-row sm:flex-wrap sm:gap-5 sm:p-6 sm:text-left md:p-8">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full
          bg-white/20 text-xl font-bold ring-4 ring-white/30 sm:h-20 sm:w-20 sm:text-2xl">
          {user.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")}
        </span>
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">
          <h2 className="text-xl font-bold [overflow-wrap:anywhere] sm:truncate sm:text-2xl">{user.name}</h2>
          <p className="text-blue-100">
            {[user.designation, user.department].filter(Boolean).join(" · ") || user.role}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{user.role}</span>
            <Badge value={user.status || "Active"} />
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm
            font-semibold text-indigo-700 shadow transition hover:bg-blue-50 sm:w-auto">
            <Pencil size={16} /> Edit profile
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 font-bold text-slate-800">
            {editing ? "Edit personal details" : "Personal details"}
          </h2>

          {editing ? (
            <form onSubmit={saveProfile} noValidate className="space-y-4">
              <FormField label="Full Name" value={form.name} error={profileErrors.name}
                onChange={(v) => setForm({ ...form, name: v })}
                sanitize={sanitizeName} allow={ALLOW_NAME_KEY} noDoubleSpace maxLength={50} />
              <FormField label="Email" value={user.email} onChange={() => {}} disabled
                className="cursor-not-allowed! bg-slate-50 text-slate-500"
                hint="Your email is managed by HR and can't be changed here" />
              <FormField label="Phone" type="tel" inputMode="numeric" value={form.phone}
                error={profileErrors.phone} onChange={(v) => setForm({ ...form, phone: v })}
                sanitize={sanitizePhone} allow={ALLOW_PHONE_KEY} maxLength={10}
                placeholder="10 digits" />
              <FormField label="Address" as="textarea" rows={3} maxLength={300}
                value={form.address} error={profileErrors.address}
                onChange={(v) => setForm({ ...form, address: v })} />
              <p className="text-xs text-slate-500">
                Email, department, designation and role are managed by HR.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
                <button type="button" onClick={() => setEditing(false)}
                  className={btnGhost}>Cancel</button>
                <button disabled={saving || !profileValid} className={btnPrimary}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <dl className="space-y-5">
              {details.map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3 sm:gap-4">
                  <span className="shrink-0 rounded-xl bg-slate-100 p-2.5 text-slate-500">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800 [overflow-wrap:anywhere]">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="mb-5 font-bold text-slate-800">Change password</h2>
          <form onSubmit={savePassword} noValidate className="space-y-4">
            <PasswordField label="Current password" autoComplete="current-password"
              value={pw.currentPassword} error={pwErrors.currentPassword}
              onChange={(v) => setPw({ ...pw, currentPassword: v })} />
            <PasswordField label="New password" showRules autoComplete="new-password"
              value={pw.newPassword} error={pwErrors.newPassword}
              onChange={(v) => setPw({ ...pw, newPassword: v })} />
            <PasswordField label="Confirm new password" autoComplete="new-password"
              value={pw.confirm} error={pwErrors.confirm}
              onChange={(v) => setPw({ ...pw, confirm: v })} />
            <div className="flex sm:justify-end">
              <button disabled={changingPw || !pwValid} className={`${btnPrimary} w-full sm:w-auto`}>
                {changingPw ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
