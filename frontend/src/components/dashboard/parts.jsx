import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "../ui";

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const time = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
export const short = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
export const weekday = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" });

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ------------------------------------------------------------------ */
/* shared pieces                                                       */
/* ------------------------------------------------------------------ */
export function Hero({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600
      via-indigo-600 to-violet-700 p-5 text-white shadow-xl shadow-indigo-200 sm:p-6 md:p-8">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-white/10" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function HeroAction({ to, Icon, label }) {
  return (
    <Link to={to} className="flex grow items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 sm:grow-0
      text-sm font-medium backdrop-blur transition hover:bg-white/25">
      <Icon size={17} /> {label}
    </Link>
  );
}

export function CardTitle({ children, sub, to, linkText = "See all" }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-bold text-slate-800">{children}</h2>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
          {linkText} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function Tip({ children }) {
  return (
    <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden
      -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-slate-800
      px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
      {children}
    </div>
  );
}

export const miniTones = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  violet: "bg-violet-50 text-violet-600"
};

// Compact clickable stat for the second row. A narrow card (three in a row on a small screen) stacks
// icon, number and label in the middle; a wider one puts the icon beside the text.
export function MiniStat({ label, value, hint, Icon, tone, to }) {
  return (
    <Link to={to} className="@container block rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
      {/* h-full: all cards in the row stay the same height even if one label wraps */}
      <Card className="flex h-full flex-col items-center gap-2 p-3 text-center transition @min-[13rem]:flex-row @min-[13rem]:gap-4 @min-[13rem]:p-4 @min-[13rem]:text-left hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
        <span className={`shrink-0 rounded-xl p-2.5 sm:p-3 ${miniTones[tone]}`}><Icon size={20} /></span>
        {/* stacked: number first, so the numbers line up even when a label takes two lines */}
        <div className="flex min-w-0 flex-col-reverse @min-[13rem]:flex-1 @min-[13rem]:flex-col">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold leading-tight text-slate-800">{value}</p>
        </div>
        <p className="hidden text-right text-xs text-slate-400 @min-[19rem]:block">{hint}</p>
      </Card>
    </Link>
  );
}

/* ---------- charts (plain HTML, one blue ramp + amber for "late") ---------- */
export function AttendanceChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.present + d.late));
  return (
    <div>
      <div className="mb-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> On time</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-amber-400" /> Late</span>
      </div>
      <div className="flex h-44 items-end gap-1.5 sm:gap-3 border-b border-slate-100">
        {data.map((d) => {
          const total = d.present + d.late;
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end">
              <Tip>{weekday(d.date)} {short(d.date)}: {d.present} on time, {d.late} late</Tip>
              <p className="mb-1 text-center text-[11px] font-semibold text-slate-600 sm:text-xs">{total || ""}</p>
              <div className="mx-auto flex w-full max-w-10 flex-col justify-end gap-0.5 transition
                group-hover:opacity-80" style={{ height: `${(total / max) * 82}%` }}>
                {d.late > 0 && (
                  <div className={`bg-amber-400 ${d.present ? "rounded-t-md rounded-b-[2px]" : "rounded-md"}`}
                    style={{ flex: d.late }} />
                )}
                {d.present > 0 && (
                  <div className={`bg-blue-600 ${d.late ? "rounded-b-md rounded-t-[2px]" : "rounded-md"}`}
                    style={{ flex: d.present }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {data.map((d) => (
          <p key={d.date} className="min-w-0 flex-1 text-center text-[11px] text-slate-500 sm:text-xs">{weekday(d.date)}</p>
        ))}
      </div>
    </div>
  );
}

export function DepartmentBars({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-400">No departments yet</p>;
  }
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.name} className="group relative">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-slate-600">{r.name}</span>
            <span className="font-semibold text-slate-800">{r.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all"
              style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function HoursChart({ records }) {
  const rows = [...records].reverse().map((r) => ({
    date: r.date,
    hours: r.checkOut ? (new Date(r.checkOut) - new Date(r.checkIn)) / 36e5 : null
  }));
  const max = Math.max(9, ...rows.map((r) => r.hours || 0));
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-400">No attendance yet</p>;
  }
  return (
    <div>
      <div className="flex h-40 items-end gap-1.5 sm:gap-3 border-b border-slate-100">
        {rows.map((r) => (
          <div key={r.date} className="group relative flex h-full flex-1 flex-col justify-end">
            <Tip>{weekday(r.date)} {short(r.date)}: {r.hours == null ? "no check-out" : `${r.hours.toFixed(1)} h`}</Tip>
            <p className="mb-1 text-center text-[11px] font-semibold text-slate-600 sm:text-xs">
              {r.hours == null ? "–" : r.hours.toFixed(1)}
            </p>
            <div className={`mx-auto w-full max-w-10 rounded-t-md transition group-hover:opacity-80 ${
              r.hours == null ? "border border-dashed border-slate-300" : "bg-linear-to-t from-blue-600 to-indigo-500"
            }`} style={{ height: `${r.hours == null ? 8 : Math.max(6, (r.hours / max) * 80)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-3">
        {rows.map((r) => (
          <p key={r.date} className="min-w-0 flex-1 text-center text-[11px] text-slate-500 sm:text-xs">{weekday(r.date)}</p>
        ))}
      </div>
    </div>
  );
}
