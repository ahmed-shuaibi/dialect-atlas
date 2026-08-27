import { useCallback, useEffect, useState } from "react";
import type {
  AtlasMode,
  AtlasUrlState,
  AtlasView,
  ExploreDisplay,
  QThreshold,
} from "@/features/atlas/types";
import { DEFAULT_Q_THRESHOLD, Q_THRESHOLDS } from "@/features/atlas/types";

export const URL_DEFAULTS: AtlasUrlState = {
  view: "explore",
  mode: "consensus",
  settings: false,
  exploreDisplay: "list",
  qThreshold: DEFAULT_Q_THRESHOLD,
  significantOnly: false,
};

const isView = (value: string | null): value is AtlasView =>
  value === "explore" || value === "compare" || value === "about";
const isMode = (value: string | null): value is AtlasMode =>
  value === "consensus" || value === "cbase" || value === "dig" || value === "mutsig";
const isExploreDisplay = (value: string | null): value is ExploreDisplay =>
  value === "network" || value === "list";
const parseQThreshold = (value: string | null): QThreshold => {
  const parsed = Number(value);
  return Q_THRESHOLDS.find((threshold) => threshold === parsed) ?? DEFAULT_Q_THRESHOLD;
};

export function parseAtlasHash(hash: string): AtlasUrlState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const cohort = params.get("cohort") || undefined;
  const pair = params.get("pair") || undefined;
  const view = params.get("view");
  const mode = params.get("mode");
  const exploreDisplay = params.get("display");
  return {
    view: isView(view) ? view : URL_DEFAULTS.view,
    cohort,
    mode: isMode(mode) ? mode : URL_DEFAULTS.mode,
    pair,
    settings: params.get("settings") === "1",
    exploreDisplay: isExploreDisplay(exploreDisplay)
      ? exploreDisplay
      : URL_DEFAULTS.exploreDisplay,
    qThreshold: parseQThreshold(params.get("q")),
    significantOnly: params.get("significant") === "1",
  };
}

export function serializeAtlasHash(state: AtlasUrlState): string {
  const params = new URLSearchParams();
  params.set("view", state.view);
  if (state.cohort) params.set("cohort", state.cohort);
  params.set("mode", state.mode);
  if (state.pair) params.set("pair", state.pair);
  if (state.settings) params.set("settings", "1");
  params.set("display", state.exploreDisplay);
  if (state.qThreshold !== DEFAULT_Q_THRESHOLD) params.set("q", String(state.qThreshold));
  if (state.significantOnly) params.set("significant", "1");
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
