// Atlas domain types — ZERO runtime deps. Cytoscape-coupled element types live in
// lib/atlas-transform.ts, not here.

export type Bmr = "cbase" | "dig" | "mutsig";
export type Direction = "ME" | "CO";
export type DirFilter = "both" | Direction;

export interface Edge {
  a: string;
  b: string;
  ga: string;
  gb: string;
  rho: number;
  lrt: number;
  tau11: number;
  ta: number;
  tb: number;
  n11: number;
  n10: number;
  n01: number;
  n00: number;
}

export interface DirData {
  n_total: number;
  edges: Edge[];
}

export interface Cohort {
  id: string;
  study: string;
  cohort: string;
  n_samples: number;
  median_tmb: number;
  eps: number;
  cbio: string;
  drivers: string[];
  bmrs: Partial<Record<Bmr, Record<Direction, DirData>>>;
}

export interface Atlas {
  bmrs: Bmr[];
  bmr_label: Record<Bmr, string>;
  /** Index-level cohorts (meta + counts only); hydrate to a full `Cohort` via `loadCohort`. */
  cohorts: CohortMeta[];
}

// --- Sharded transport (see scripts/shard-atlas.mjs) -----------------------------------------
// The atlas ships as a small index (cohort meta + per-bmr ME/CO counts, no edges) plus one heavy
// per-cohort shard fetched lazily on selection. The index is loaded up front; a shard hydrates
// its cohort's `drivers` + full edges in place. After hydration a cohort is the full `Cohort`.

/** Per-bmr counts carried in the index (edges omitted until the cohort shard is fetched). */
export type CohortCounts = Partial<Record<Bmr, Record<Direction, { n_total: number }>>>;

/** Index-level cohort: meta + counts only. Drives the combobox / Show counts / strip totals. */
export interface CohortMeta {
  id: string;
  study: string;
  cohort: string;
  n_samples: number;
  median_tmb: number;
  eps: number;
  cbio: string;
  bmrs: CohortCounts;
}

/** The small, up-front index file (public/data/atlas/index.json). */
export interface AtlasIndex {
  bmrs: Bmr[];
  bmr_label: Record<Bmr, string>;
  cohorts: CohortMeta[];
}

/** A per-cohort shard (public/data/atlas/cohort/<id>.json): the heavy payload. */
export interface CohortShard {
  drivers: string[];
  bmrs: Partial<Record<Bmr, Record<Direction, DirData>>>;
}

/** A table row: an edge tagged with its direction + credibility annotations. */
export type Row = Edge & {
  type: Direction;
  /** base gene (suffix-stripped) of this edge is in PASSENGER_GENES */
  isPassenger: boolean;
  /** how many of the (up to 3) BMR models contain this same pair in the same direction */
  replicatedIn: number;
};
