import { Link } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

/* ---------- shared class names ---------- */
export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm " +
  "text-slate-800 outline-none transition placeholder:text-slate-400 " +
  "focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl " +
  "bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm " +
  "font-semibold text-white shadow-sm transition hover:shadow-md " +
  "hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border " +
  "border-slate-200 bg-white px-5 py-2.5 text-sm font-medium " +
  "text-slate-700 transition hover:bg-slate-50";

export const th =
  "px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500";
export const td = "px-5 py-4 text-sm text-slate-700";

/* ---------- building blocks ---------- */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  );
}

const tiles = {
  blue: "from-blue-500 to-blue-600 shadow-blue-200",
  amber: "from-amber-400 to-orange-500 shadow-amber-200",
  green: "from-emerald-400 to-emerald-600 shadow-emerald-200",
  violet: "from-violet-500 to-purple-600 shadow-violet-200",
  rose: "from-rose-400 to-rose-600 shadow-rose-200"
};

export function StatCard({ label, value, hint, Icon, tone = "blue", to, onClick, active }) {
  const clickable = !!(to || onClick);
  const card = (
    <Card className={`p-0 transition hover:-translate-y-0.5 hover:shadow-md ${
      clickable ? "cursor-pointer hover:border-blue-200" : ""} ${
      active ? "border-blue-400 ring-4 ring-blue-100" : ""}`}>
      <div className="flex items-start justify-between gap-2 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
          <p className="mt-1.5 text-lg font-bold tracking-tight text-slate-800 [overflow-wrap:anywhere] sm:mt-2 sm:text-2xl 2xl:text-3xl">
            {value}
          </p>
        </div>
        <span className={`shrink-0 rounded-xl bg-linear-to-br p-2 text-white shadow-lg sm:rounded-2xl sm:p-3 ${tiles[tone]}`}>
          <Icon className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500 sm:px-5 sm:py-3 sm:text-xs">
        <span className="min-w-0 [overflow-wrap:anywhere]">{hint}</span>
        {to && (
          <span className="flex shrink-0 items-center gap-1 font-medium text-blue-600">
            <span className="hidden min-[400px]:inline">Details</span> <ArrowRight size={13} />
          </span>
        )}
      </div>
    </Card>
  );

  // The whole card is the link / button
  if (to) {
    return (
      <Link to={to} className="block rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
        {card}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={!!active}
        className="block w-full rounded-2xl text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
        {card}
      </button>
    );
  }
  return card;
}

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("");

export function Avatar({ name, size = "h-10 w-10 text-sm" }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full
      bg-linear-to-br from-blue-500 to-violet-500 font-semibold text-white ${size}`}>
      {initialsOf(name) || "?"}
    </span>
  );
}

const badgeTones = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Late: "bg-orange-50 text-orange-700 ring-orange-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-200"
};

export function Badge({ value }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1
      text-xs font-medium ring-1 ring-inset ${
        badgeTones[value] || "bg-slate-100 text-slate-600 ring-slate-200"
      }`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export function EmptyRow({ cols, text }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-14 text-center text-sm text-slate-400">
        {text}
      </td>
    </tr>
  );
}

// Grey pulsing rows shown inside a table while its data is loading
export function SkeletonRows({ cols, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse" aria-hidden="true">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-5 py-4">
              <div className="h-4 rounded bg-slate-200" style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Grey pulsing list items shown on phones while a card list is loading
export function SkeletonList({ count = 4 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} aria-hidden="true" className="animate-pulse space-y-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </li>
      ))}
    </>
  );
}

// Grey pulsing cards shown while a card grid is loading
export function SkeletonCards({ count = 8, height = "h-64" }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden="true"
          className={`${height} animate-pulse rounded-2xl border border-slate-100 bg-white p-5 shadow-sm`}>
          <div className="h-12 w-12 rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-1/2 rounded bg-slate-200" />
          <div className="mt-6 space-y-2">
            <div className="h-3 rounded bg-slate-200" />
            <div className="h-3 w-5/6 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  useLockBodyScroll(true);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
      bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl
        bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b
          border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100
            hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
