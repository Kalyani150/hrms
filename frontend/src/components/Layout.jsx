import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, CalendarCheck, CalendarDays,
  Wallet, UserRound, LogOut, Menu, X, Building2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import useLockBodyScroll from "../hooks/useLockBodyScroll";
import { Avatar, Modal, btnGhost } from "./ui";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useLockBodyScroll(open); // mobile sidebar drawer

  const links = [
    ["Dashboard", "/dashboard", LayoutDashboard],
    ...(user.role === "Admin"
      ? [["Employees", "/employees", Users]]
      : []),
    ["Attendance", "/attendance", CalendarCheck],
    ["Leaves", "/leaves", CalendarDays],
    ["Payroll", "/payroll", Wallet],
    ["Profile", "/profile", UserRound]
  ];

  const current = links.find(([, path]) => pathname.startsWith(path))?.[0] || "Dashboard";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const loginPath = user.role === "Admin" ? "/admin/login" : "/login";
      await logout();
      setConfirmLogout(false);
      navigate(loginPath);
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f5f7fb]">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r
        border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}>
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-600 p-2 text-white">
              <Building2 size={20} />
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-800">HRMS</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-slate-500 lg:hidden"><X /></button>
        </div>

        <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </p>
        <nav className="flex-1 space-y-1 px-3">
          {links.map(([label, path, Icon]) => (
            <NavLink key={path} to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm
                font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
          <button onClick={() => setConfirmLogout(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl
            border border-slate-200 bg-white py-2.5 text-sm font-medium text-rose-600
            transition hover:bg-rose-50">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center
          justify-between border-b border-slate-200/70 bg-white/80 px-5
          backdrop-blur md:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)}
              className="rounded-lg p-1.5 hover:bg-slate-100 lg:hidden"><Menu /></button>
            <h2 className="text-lg font-semibold text-slate-800">{current}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
            <Avatar name={user.name} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-3 min-[360px]:p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {confirmLogout && (
        <Modal title="Log out?" onClose={() => !loggingOut && setConfirmLogout(false)}>
          <div className="flex items-start gap-4">
            <span className="rounded-xl bg-rose-50 p-3 text-rose-600"><LogOut size={22} /></span>
            <p className="text-sm text-slate-600">
              Are you sure you want to log out of your account? You'll need to sign in again to continue.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setConfirmLogout(false)} disabled={loggingOut}
              className={btnGhost}>
              Cancel
            </button>
            <button type="button" onClick={handleLogout} disabled={loggingOut}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5
              text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700
              disabled:cursor-not-allowed disabled:opacity-60">
              <LogOut size={16} /> {loggingOut ? "Logging out..." : "Yes, log out"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
