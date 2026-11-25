import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useLockBodyScroll from "../hooks/useLockBodyScroll";

/* ---------- shared class names ---------- */
export const inputCls =
  // 16px text on phones stops iOS Safari zooming in when a field is focused
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm " +
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
// Narrower cells for ResponsiveTable, so more columns fit before it has to switch to cards
export const cell = "px-3 py-3.5 text-sm text-slate-700 xl:px-4";

/* A row of equal cards. The column classes are chosen by the space actually available (@... variants),
   so four cards sit in one row or split 2 x 2, and never leave a single card on its own line. */
export function CardRow({ className = "", children }) {
  return (
    <div className="@container">
      <div className={`grid grid-cols-1 gap-3 sm:gap-5 ${className}`}>{children}</div>
    </div>
  );
}

/* A normal table while its container is at least `stackBelow` pixels wide, otherwise one card per row.
   Without `stackBelow` it stays a table and scrolls sideways when narrow.
   In card form each cell is labelled by its data-label; see .table-stacked in index.css. */
export function ResponsiveTable({ columns, stackBelow = 0, className = "", children }) {
  const ref = useRef(null);
  const [stacked, setStacked] = useState(false);

  useLayoutEffect(() => {
    const box = ref.current;
    const check = () => setStacked(box.clientWidth < stackBelow);
    check(); // before the first paint, so the layout does not jump
    const observer = new ResizeObserver(check);
    observer.observe(box);
    return () => observer.disconnect();
  }, [stackBelow]);

  return (
    <div ref={ref} className="overflow-x-auto">
      <table className={`w-full text-left ${className} ${stacked ? "table-stacked" : ""}`}>
        <thead className="bg-slate-50">
          <tr>
            {columns.map((h) =>
              <th key={h} className="whitespace-nowrap px-3 py-3.5 text-xs font-semibold uppercase
                tracking-wide text-slate-500 xl:px-4">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

const PREVIEW_LENGTH = 20; // characters of long text shown while collapsed

/* Long free text (a leave reason, an address): only the start is shown until it is double-clicked;
   double-clicking again shortens it (nothing on hover). Long words wrap instead of widening the layout. */
export function ExpandableText({ text, empty = "—", className = "" }) {
  const [open, setOpen] = useState(false);
  const long = (text || "").length > PREVIEW_LENGTH;
  const shown = long && !open ? `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…` : text;

  return (
    // touch-manipulation: a double tap on a phone reaches the text instead of zooming the page
    <p onDoubleClick={long ? () => setOpen(!open) : undefined}
      className={`[overflow-wrap:anywhere] ${long ? "cursor-pointer touch-manipulation select-none" : ""} ${className}`}>
      {shown || <span className="text-slate-400">{empty}</span>}
    </p>
  );
}

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
    // h-full + flex: cards in a row are the same height and their footers line up
    <Card className={`@container flex h-full flex-col p-0 transition hover:-translate-y-0.5 hover:shadow-md ${
      clickable ? "cursor-pointer hover:border-blue-200" : ""} ${
      active ? "border-blue-400 ring-4 ring-blue-100" : ""}`}>
      {/* In a narrow card the value gets the full width under the label and icon */}
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto] content-start gap-x-2 p-4 sm:p-5">
        <p className="col-start-1 row-start-1 text-xs font-medium text-slate-500 sm:text-sm">{label}</p>
        <span className={`col-start-2 row-start-1 self-start rounded-xl bg-linear-to-br p-2 text-white shadow-lg @min-[14rem]:row-span-2 sm:rounded-2xl sm:p-3 ${tiles[tone]}`}>
          <Icon className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
        </span>
        <p className={`col-start-1 row-start-2 mt-1.5 font-bold tracking-tight text-slate-800 [overflow-wrap:anywhere] @max-[14rem]:col-span-2 sm:mt-2 ${
          // long values (large amounts) shrink with the card instead of breaking mid-number
          String(value).length > 8
            ? "text-[length:clamp(1rem,10cqi,1.5rem)] 2xl:text-[length:clamp(1rem,10cqi,1.875rem)]"
            : "text-lg sm:text-2xl 2xl:text-3xl"
        }`}>
          {value}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500 sm:px-5 sm:py-3 sm:text-xs">
        <span className="min-w-0 [overflow-wrap:anywhere]">{hint}</span>
        {to && (
          <span className="flex shrink-0 items-center gap-1 font-medium text-blue-600">
            <span className="hidden @min-[14rem]:inline">Details</span> <ArrowRight size={13} />
          </span>
        )}
      </div>
    </Card>
  );

  // The whole card is the link / button
  if (to) {
    return (
      <Link to={to} className="block h-full rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
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
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1
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
      <div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl
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

/* Page numbers: Previous  1 2 3 ... 9  Next. Shows nothing when everything fits on one page. */
export function Pagination({ page, pageSize, total, onChange }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  // 1 ... (page-1) page (page+1) ... last
  const shown = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const items = shown.flatMap((n, i) => (i && n - shown[i - 1] > 1 ? ["gap" + n, n] : [n]));

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const nav = "flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium " +
    "text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500">Showing {from}–{to} of {total}</p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className={nav}>
          <ChevronLeft size={16} /> Previous
        </button>
        {items.map((n) => typeof n === "string" ? (
          <span key={n} className="px-1 text-slate-400">…</span>
        ) : (
          <button key={n} onClick={() => onChange(n)} aria-current={n === page ? "page" : undefined}
            className={`h-9 min-w-9 rounded-xl px-2 text-sm font-medium transition ${
              n === page ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === pages} className={nav}>
          Next <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
