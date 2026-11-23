import { useState } from "react";
import { inputCls } from "./ui";

/**
 * Input with live validation.
 *  - `error` comes from a validator in utils/validation.js ("" means valid)
 *  - the message shows in red under the field once the user has typed or left it
 *  - the border turns red when invalid and green when valid
 *  - `allow` (a regex for ONE character) blocks other key presses; `sanitize` cleans pasted text
 */
export default function FormField({
  label, value, onChange, error = "", type = "text", as = "input",
  sanitize, allow, noDoubleSpace = false, forceShow = false, leftIcon, rightSlot, hint,
  className = "", ...rest
}) {
  const [touched, setTouched] = useState(false);

  const invalid = (touched || forceShow) && !!error;
  const valid = touched && !error && String(value ?? "") !== "";

  const state = invalid
    ? "border-rose-500! focus:border-rose-500! focus:ring-rose-100!"
    : valid
      ? "border-emerald-500! focus:border-emerald-500! focus:ring-emerald-100!"
      : "";

  const handleChange = (e) => {
    let v = e.target.value;
    if (sanitize) v = sanitize(v);
    setTouched(true);
    onChange(v);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return; // shortcuts, Backspace, arrows...
    if (allow && !allow.test(e.key)) {
      e.preventDefault();
      return;
    }
    if (noDoubleSpace && e.key === " " && (!value || String(value).endsWith(" "))) {
      e.preventDefault();
    }
  };

  const Tag = as;
  const id = rest.id || `f-${label?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-600">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </span>
        )}
        <Tag
          id={id}
          type={as === "input" ? type : undefined}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid}
          className={`${inputCls} ${leftIcon ? "pl-11" : ""} ${rightSlot ? "pr-12" : ""} ${state} ${className}`}
          {...rest}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
      {invalid && (
        <p className="mt-1 text-xs font-medium text-rose-600" role="alert">{error}</p>
      )}
      {!invalid && hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
