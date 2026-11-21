import { useEffect } from "react";

// Reference-counted scroll lock: the page is frozen while at least one
// modal/drawer is open and is always released when the last one closes.
let locks = 0;

const apply = (hidden) => {
  const value = hidden ? "hidden" : "";
  document.body.style.overflow = value;
  document.documentElement.style.overflow = value;
};

// A hot-reload or crash must never leave the page frozen
if (typeof document !== "undefined") apply(false);

export default function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return;

    locks += 1;
    apply(true);

    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) apply(false);
    };
  }, [locked]);
}
