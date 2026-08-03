import { useMemo } from "react";
import {
  buildElements,
  tableRows,
} from "@/features/atlas/lib/atlas-transform";
import type { Atlas, Bmr, Cohort, CohortMeta, DirFilter, Row } from "@/features/atlas/types";

export const TOPK = 25;

/**
 * Default hash state. Cohort defaults to LUAD (a dense, most-cited TCGA lung cohort) so first
 * paint is a real drawn network, not an empty canvas. Direction defaults to ME (not "both");
 * passenger filter ON.
 */
export const VIEW_DEFAULTS = { c: "TCGA__LUAD", b: "cbase", d: "ME", f: "1" } as const;

/** A validated, coerced view derived from the raw URL hash. */
export interface AtlasView {
  cohort: Cohort;
  bmr: Bmr;
  dir: DirFilter;
  excludePassengers: boolean;
  net: ReturnType<typeof buildElements>;
  rows: Row[];
}

const DIR_FILTERS: DirFilter[] = ["both", "ME", "CO"];

/**
 * Resolve which cohort the hash selects, from the index (meta + counts, edges not yet hydrated).
 * Falls back to the first cohort for a missing/invalid `c`. This is the value to feed `useCohort`
 * so the right shard is fetched. Pure given (hash, atlas).
 */
export function resolveCohort(hash: Record<string, string>, atlas: Atlas): CohortMeta {
  return atlas.cohorts.find((c) => c.id === hash.c) ?? atlas.cohorts[0];
}

/** Resolve + validate the bmr/direction/passenger view knobs from the hash. Pure. */
export function resolveKnobs(hash: Record<string, string>, atlas: Atlas) {
  const bmr = (atlas.bmrs.includes(hash.b as Bmr) ? hash.b : "cbase") as Bmr;
  const dir = (DIR_FILTERS.includes(hash.d as DirFilter) ? hash.d : "ME") as DirFilter;
  const excludePassengers = hash.f !== "0";
  return { bmr, dir, excludePassengers };
}

/**
 * Coerce a raw hash map + a HYDRATED cohort into a validated view. Invalid/missing knobs fall
 * back to safe defaults (bmr → cbase if unavailable, dir → ME, excludePassengers → true). The
 * cohort must already carry edges (hydrated via `useCohort`); net/rows derive from them. Pure.
 *
 * Hash keys:
 *   c — cohort id
 *   b — BMR model (cbase | dig | mutsig)
 *   d — direction filter (both | ME | CO), default ME
 *   f — exclude-passengers flag ("0" disables; anything else / missing = enabled)
 */
export function parseView(
  hash: Record<string, string>,
  atlas: Atlas,
  cohort: Cohort,
): AtlasView {
  const { bmr, dir, excludePassengers } = resolveKnobs(hash, atlas);

  return {
    cohort,
    bmr,
    dir,
    excludePassengers,
    net: buildElements(cohort, bmr, dir, TOPK, excludePassengers),
    rows: tableRows(cohort, bmr, dir, TOPK, excludePassengers, atlas),
  };
}

/**
 * Memoized derivation of the view from the current hash + loaded atlas + the hydrated cohort.
 * Returns null until both the index and the selected cohort's shard are available.
 */
export function useAtlasView(
  hash: Record<string, string>,
  atlas: Atlas | null,
  cohort: Cohort | null,
): AtlasView | null {
  return useMemo(
    () => (atlas && cohort ? parseView(hash, atlas, cohort) : null),
    [hash, atlas, cohort],
  );
}
