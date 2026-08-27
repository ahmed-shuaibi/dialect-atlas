export const BMR_IDS = ["cbase", "dig", "mutsig"] as const;

export type Bmr = (typeof BMR_IDS)[number];
export type AtlasView = "explore" | "compare" | "about";
export type AtlasMode = "consensus" | Bmr;
export type Direction = "ME" | "CO";
export type TransportDirection = Direction | "neutral";

export interface CompactTable {
  fields: string[];
  rows: unknown[][];
}

export interface ReleaseManifest {
  release_id: string;
  schema_version: string;
  immutable: boolean;
  generated_at: string;
  coverage: unknown;
  analysis: unknown;
  bmrs: unknown;
  methods: unknown;
  index_file: string;
  readme_file: string;
  readme_sha256: string;
  readme_bytes: number;
}

export interface CohortMeta {
  id: string;
  study: string;
  cohort: string;
  cancer: string;
  n_samples: number;
  median_mutations: number;
  cbio: string;
  data_file: string;
  data_sha256: string;
  data_bytes: number;
}

export interface ReleaseIndex {
  release_id: string;
  cohorts: CohortMeta[];
}

export interface ReleaseBundle {
  manifest: ReleaseManifest;
  index: ReleaseIndex;
}

export interface DialectRow {
  ga: string;
  gb: string;
  tau00: number;
  tau10: number;
  tau01: number;
  tau11: number;
  observedBoth: number;
  observedBOnly: number;
  observedAOnly: number;
  observedNeither: number;
  tau1x: number;
  taux1: number;
  rho: number;
  logOddsRatio: number | null;
  /** Raw transport value. Negative fitted values are treated as zero evidence. */
  lrt: number;
  wald: number | null;
  p: number | null;
  q: number | null;
  direction: TransportDirection;
  rank: number;
  tauMass: number;
  effectiveN: number;
  excludedSamples: number;
}

export interface BaselineRow {
  ga: string;
  gb: string;
  fisherMeP: number | null;
  fisherCoP: number | null;
  fisherMeQ: number | null;
  fisherCoQ: number | null;
  discoverMeP: number | null;
  discoverCoP: number | null;
  discoverMeQ: number | null;
  discoverCoQ: number | null;
  megsaScore: number | null;
  megsaP: number | null;
  megsaQ: number | null;
  wesmeP: number | null;
  wescoP: number | null;
  wesmeQ: number | null;
  wescoQ: number | null;
}

export interface CohortData {
  id: string;
  drivers: string[];
  models: Record<Bmr, DialectRow[]>;
  baselines: BaselineRow[];
  mutsigCbaseFallbackFeatures: string[];
}

export interface ModelMatch {
  bmr: Bmr;
  row: DialectRow;
  percentile: number;
}

export interface PairEvidence {
  bmr: Bmr;
  /** The model row, oriented to the InteractionResult's ga/gb order. */
  row: DialectRow;
}

export interface InteractionResult {
  id: string;
  ga: string;
  gb: string;
  direction: Direction;
  representative: DialectRow;
  /** Same-direction rows used exclusively for consensus, support, and ranking. */
  matches: ModelMatch[];
  /** Every model row for this pair, including opposite and neutral directions. */
  pairEvidence: PairEvidence[];
  fdrSupport: number;
  mutsigFallbackFeatures: string[];
  worstPercentile: number;
  medianPercentile: number;
}

export interface PairSelection {
  direction: Direction;
  ga: string;
  gb: string;
}

export interface AtlasUrlState {
  view: AtlasView;
  cohort?: string;
  mode: AtlasMode;
  pair?: string;
  settings: boolean;
  strict: boolean;
  compareDirection: Direction;
}
