import { useCallback, useEffect, useState } from "react";

/** Read the current `#key=value&...` params from the URL hash. */
function readHash(): Record<string, string> {
  const h = window.location.hash.replace(/^#/, "");
  const out: Record<string, string> = {};
  for (const part of h.split("&")) {
    if (!part) continue;
    const i = part.indexOf("=");
    if (i === -1) continue;
    out[decodeURIComponent(part.slice(0, i))] = decodeURIComponent(part.slice(i + 1));
  }
  return out;
}

/**
 * Tiny shareable URL-state hook: keeps a flat string map in the location hash so the view is a
 * bookmarkable link. Four keys (see VIEW_DEFAULTS): c (cohort) · b (BMR model) · d (direction) ·
 * f (passenger filter). top-K is a fixed constant and the selected pair is local component state;
 * neither is hashed.
 */
export function useHashState(defaults: Record<string, string>) {
  const [state, setState] = useState<Record<string, string>>(() => ({
    ...defaults,
    ...readHash(),
  }));

  useEffect(() => {
    const onHash = () => setState((s) => ({ ...s, ...readHash() }));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const set = useCallback((patch: Record<string, string | undefined>) => {
    setState((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") delete next[k];
        else next[k] = v;
      }
      const qs = Object.entries(next)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      const url = `${window.location.pathname}${window.location.search}#${qs}`;
      window.history.replaceState(null, "", url);
      return next;
    });
  }, []);

  return [state, set] as const;
}
