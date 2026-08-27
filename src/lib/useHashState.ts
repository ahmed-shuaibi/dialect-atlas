import { useCallback, useEffect, useState } from "react";
import type { AtlasMode, AtlasUrlState, AtlasView, Direction } from "@/features/atlas/types";

export const URL_DEFAULTS: AtlasUrlState = {
  view: "explore",
  mode: "consensus",
  settings: false,
  strict: false,
  compareDirection: "ME",
};

const isView = (value: string | null): value is AtlasView =>
  value === "explore" || value === "compare" || value === "about";
const isMode = (value: string | null): value is AtlasMode =>
  value === "consensus" || value === "cbase" || value === "dig" || value === "mutsig";
const isDirection = (value: string | null): value is Direction => value === "ME" || value === "CO";

export function parseAtlasHash(hash: string): AtlasUrlState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const cohort = params.get("cohort") || undefined;
  const pair = params.get("pair") || undefined;
  const view = params.get("view");
  const mode = params.get("mode");
  const compareDirection = params.get("compare");
  return {
    view: isView(view) ? view : URL_DEFAULTS.view,
    cohort,
    mode: isMode(mode) ? mode : URL_DEFAULTS.mode,
    pair,
    settings: params.get("settings") === "1",
    strict: params.get("strict") === "1",
    compareDirection: isDirection(compareDirection)
      ? compareDirection
      : URL_DEFAULTS.compareDirection,
  };
}

export function serializeAtlasHash(state: AtlasUrlState): string {
  const params = new URLSearchParams();
  params.set("view", state.view);
  if (state.cohort) params.set("cohort", state.cohort);
  params.set("mode", state.mode);
  if (state.pair) params.set("pair", state.pair);
  if (state.settings) params.set("settings", "1");
  if (state.strict) params.set("strict", "1");
  params.set("compare", state.compareDirection);
  return `#${params.toString()}`;
}

export function useHashState() {
  const [state, setState] = useState<AtlasUrlState>(() => parseAtlasHash(window.location.hash));

  useEffect(() => {
    const sync = () => setState(parseAtlasHash(window.location.hash));
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  const set = useCallback(
    (patch: Partial<AtlasUrlState>, options?: { replace?: boolean }) => {
      setState((previous) => {
        const next = { ...previous, ...patch };
        const url = `${window.location.pathname}${window.location.search}${serializeAtlasHash(next)}`;
        if (options?.replace) window.history.replaceState(null, "", url);
        else window.history.pushState(null, "", url);
        return next;
      });
    },
    [],
  );

  return [state, set] as const;
}
