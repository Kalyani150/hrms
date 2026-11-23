import { useState } from "react";
import { Lock, Eye, EyeOff, Check, Circle } from "lucide-react";
import FormField from "./FormField";
import { ALLOW_PASSWORD_KEY, sanitizePassword, PASSWORD_SYMBOLS } from "../utils/validation";

const RULES = [
  ["At least 8 characters", (v) => v.length >= 8],
  ["An uppercase letter", (v) => /[A-Z]/.test(v)],
  ["A lowercase letter", (v) => /[a-z]/.test(v)],
  ["A number", (v) => /\d/.test(v)],
  ["A symbol (e.g. @ # $ !)", (v) => /[^A-Za-z0-9]/.test(v)]
];

/** Password input with a show/hide toggle and, optionally, a live checklist of the password rules. */
export default function PasswordField({ showRules = false, value, ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <FormField type={show ? "text" : "password"} value={value} leftIcon={<Lock size={18} />}
        allow={ALLOW_PASSWORD_KEY} sanitize={sanitizePassword} maxLength={128}
        rightSlot={
          <button type="button" onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...props} />

      {showRules && (
        <p className="mt-1 text-xs text-slate-400">
          Letters, numbers and these symbols only: {PASSWORD_SYMBOLS}
        </p>
      )}

      {showRules && value && (
        <ul className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2">
          {RULES.map(([text, test]) => {
            const ok = test(value);
            return (
              <li key={text} className={`flex items-center gap-1.5 ${ok ? "text-emerald-600" : "text-slate-400"}`}>
                {ok ? <Check size={13} /> : <Circle size={13} />} {text}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
