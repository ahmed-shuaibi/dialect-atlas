import {
  BMR_IDS,
  DEFAULT_Q_THRESHOLD,
  type AtlasMode,
  type Bmr,
  type CohortData,
  type DialectRow,
  type Direction,
  type InteractionResult,
  type ModelMatch,
  type PairEvidence,
  type PairSelection,
} from "@/features/atlas/types";

export const BMR_LABEL: Record<Bmr, string> = {
  cbase: "CBaSE",
  dig: "DIG",
  mutsig: "MutSigCV2",
};

export const STUDY_LABEL: Record<string, string> = {
  TCGA: "TCGA PanCan Atlas",
  "MSK-IMPACT": "MSK-IMPACT",
  "MSK-CHORD": "MSK-CHORD",
};

export const baseGene = (geneEffect: string) => geneEffect.replace(/_[MN]$/, "");

export function pairKey(ga: string, gb: string): string {
  return [ga, gb].sort().join("::");
}

/** Locale-independent ordinal ordering, matching the immutable release validator. */
export function codePointCompare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function resultId(direction: Direction, ga: string, gb: string): string {
  return `${direction}::${pairKey(ga, gb)}`;
}

export function parsePairId(value: string | undefined): PairSelection | null {
  if (!value) return null;
  const [direction, ga, gb, ...rest] = value.split("::");
  if (rest.length > 0 || (direction !== "ME" && direction !== "CO") || !ga || !gb) return null;
  return { direction, ga, gb };
}

export const isSameBaseGene = (row: Pick<DialectRow, "ga" | "gb">) =>
  baseGene(row.ga) === baseGene(row.gb);

export const isSignificant = (
  row: Pick<DialectRow, "q">,
  qThreshold = DEFAULT_Q_THRESHOLD,
): boolean => row.q != null && row.q < qThreshold;

/** Negative fitted LRT values carry zero evidence under the release contract. */
export const lrtEvidence = (row: Pick<DialectRow, "lrt">) => Math.max(0, row.lrt);

const isDirection = (row: DialectRow): row is DialectRow & { direction: Direction } =>
  row.direction === "ME" || row.direction === "CO";

type CohortIndexes = {
  byModel: Record<Bmr, Map<string, DialectRow>>;
  byPair: Record<Bmr, Map<string, DialectRow>>;
  denominators: Record<Bmr, Record<Direction, number>>;
  mutsigFallback: Set<string>;
};

const indexCache = new WeakMap<CohortData, CohortIndexes>();

function cohortIndexes(data: CohortData): CohortIndexes {
  const cached = indexCache.get(data);
  if (cached) return cached;
  const byModel = {} as Record<Bmr, Map<string, DialectRow>>;
  const byPair = {} as Record<Bmr, Map<string, DialectRow>>;
  const denominators = {} as Record<Bmr, Record<Direction, number>>;
  for (const bmr of BMR_IDS) {
    const map = new Map<string, DialectRow>();
    const pairMap = new Map<string, DialectRow>();
    const max: Record<Direction, number> = { ME: 1, CO: 1 };
    for (const row of data.models[bmr]) {
      const pair = pairKey(row.ga, row.gb);
      const pairPrior = pairMap.get(pair);
      if (!pairPrior || row.rank < pairPrior.rank) pairMap.set(pair, row);
      if (!isDirection(row)) continue;
      const id = resultId(row.direction, row.ga, row.gb);
      const prior = map.get(id);
      if (!prior || row.rank < prior.rank) map.set(id, row);
      max[row.direction] = Math.max(max[row.direction], row.rank);
    }
    byModel[bmr] = map;
    byPair[bmr] = pairMap;
    denominators[bmr] = max;
  }
  const indexes = {
    byModel,
    byPair,
    denominators,
    mutsigFallback: new Set(data.mutsigCbaseFallbackFeatures),
  };
  indexCache.set(data, indexes);
  return indexes;
}

export function mutsigFallbackForPair(
  data: CohortData,
  ga: string,
  gb: string,
): string[] {
  const fallback = cohortIndexes(data).mutsigFallback;
  return [ga, gb].filter((feature) => fallback.has(feature));
}

function median(values: number[]): number {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] ?? 1;
}

/** Return a pair row in the requested gene order, preserving A/B contingency semantics. */
export function orientDialectRow(row: DialectRow, ga: string, gb: string): DialectRow {
  if (row.ga === ga && row.gb === gb) return row;
  if (row.ga !== gb || row.gb !== ga) {
    throw new Error(`Cannot orient unrelated pair ${row.ga}::${row.gb} as ${ga}::${gb}`);
  }
  return {
    ...row,
    ga,
    gb,
    tau10: row.tau01,
    tau01: row.tau10,
    observedBOnly: row.observedAOnly,
    observedAOnly: row.observedBOnly,
    tau1x: row.taux1,
    taux1: row.tau1x,
  };
}

function exactMatches(data: CohortData, row: DialectRow & { direction: Direction }): ModelMatch[] {
  const indexes = cohortIndexes(data);
  const id = resultId(row.direction, row.ga, row.gb);
  return BMR_IDS.flatMap((bmr) => {
    const match = indexes.byModel[bmr].get(id);
    if (!match) return [];
    return [
      {
        bmr,
        row: orientDialectRow(match, row.ga, row.gb),
        percentile: match.rank / indexes.denominators[bmr][row.direction],
      },
    ];
  });
}

function allPairEvidence(
  data: CohortData,
  row: Pick<DialectRow, "ga" | "gb">,
): PairEvidence[] {
  const indexes = cohortIndexes(data);
  const id = pairKey(row.ga, row.gb);
  return BMR_IDS.flatMap((bmr) => {
    const evidence = indexes.byPair[bmr].get(id);
    return evidence
      ? [{ bmr, row: orientDialectRow(evidence, row.ga, row.gb) }]
      : [];
  });
}

function toResult(data: CohortData, representative: DialectRow & { direction: Direction }): InteractionResult {
  const matches = exactMatches(data, representative);
  const pairEvidence = allPairEvidence(data, representative);
  const percentiles = matches.map((match) => match.percentile);
  return {
    id: resultId(representative.direction, representative.ga, representative.gb),
    ga: representative.ga,
    gb: representative.gb,
    direction: representative.direction,
    representative,
    matches,
    pairEvidence,
    mutsigFallbackFeatures: pairEvidence.some(({ bmr }) => bmr === "mutsig")
      ? mutsigFallbackForPair(data, representative.ga, representative.gb)
      : [],
    worstPercentile: percentiles.length ? Math.max(...percentiles) : 1,
    medianPercentile: median(percentiles),
  };
}

/**
 * Three-BMR consensus: the exact gene-effect pair has the same direction under CBaSE,
 * DIG, and a real MutSigCV2 background. Optional significance filtering applies the
 * selected q cutoff to every model. Results use conservative directional rank percentiles.
 */
export type ResultFilter = {
  qThreshold?: number;
  significantOnly?: boolean;
};

export function consensusResults(
  data: CohortData,
  direction: Direction,
  { qThreshold = DEFAULT_Q_THRESHOLD, significantOnly = true }: ResultFilter = {},
): InteractionResult[] {
  const seen = new Set<string>();
  const results: InteractionResult[] = [];
  for (const row of data.models.cbase) {
    if (row.direction !== direction || isSameBaseGene(row)) continue;
    if (mutsigFallbackForPair(data, row.ga, row.gb).length > 0) continue;
    const id = resultId(direction, row.ga, row.gb);
    if (seen.has(id)) continue;
    seen.add(id);
    const result = toResult(data, row as DialectRow & { direction: Direction });
    if (result.matches.length !== BMR_IDS.length) continue;
    if (significantOnly && !result.matches.every(({ row: match }) => isSignificant(match, qThreshold))) continue;
    results.push(result);
  }
  return results.sort(
    (a, b) =>
      a.worstPercentile - b.worstPercentile ||
      a.medianPercentile - b.medianPercentile ||
      codePointCompare(a.id, b.id),
  );
}

export function modelResults(
  data: CohortData,
  bmr: Bmr,
  direction: Direction,
  { qThreshold = DEFAULT_Q_THRESHOLD, significantOnly = true }: ResultFilter = {},
): InteractionResult[] {
  const results = data.models[bmr]
    .filter((row): row is DialectRow & { direction: Direction } => isDirection(row))
    .filter(
      (row) =>
        row.direction === direction &&
        !isSameBaseGene(row) &&
        (!significantOnly || isSignificant(row, qThreshold)),
    )
    .map((row) => toResult(data, row));

  return results.sort(
    (a, b) =>
      a.representative.rank - b.representative.rank || codePointCompare(a.id, b.id),
  );
}

export function resultsForMode(
  data: CohortData,
  mode: AtlasMode,
  direction: Direction,
  filter: ResultFilter = {},
): InteractionResult[] {
  return mode === "consensus"
    ? consensusResults(data, direction, filter)
    : modelResults(data, mode, direction, filter);
}

/** The exact ranked candidate set shared by Explore's network and list renderers. */
export function exploreResults(
  data: CohortData,
  mode: AtlasMode,
  filter: ResultFilter = {},
): InteractionResult[] {
  return [
    ...resultsForMode(data, mode, "ME", filter),
    ...resultsForMode(data, mode, "CO", filter),
  ];
}

export function filterResultsByGene(
  results: InteractionResult[],
  query: string,
): InteractionResult[] {
  const needle = query.trim().toLocaleUpperCase("en-US");
  if (!needle) return results;
  return results.filter(
    ({ ga, gb }) =>
      ga.toLocaleUpperCase("en-US").includes(needle) ||
      gb.toLocaleUpperCase("en-US").includes(needle) ||
      baseGene(ga).toLocaleUpperCase("en-US").includes(needle) ||
      baseGene(gb).toLocaleUpperCase("en-US").includes(needle),
  );
}

/** The q-value that controls an interaction's visible significance encoding. */
export function resultQ(result: InteractionResult, mode: AtlasMode): number {
  if (mode !== "consensus") {
    return result.matches.find(({ bmr }) => bmr === mode)?.row.q ?? 1;
  }
  return Math.max(...result.matches.map(({ row }) => row.q ?? 1));
}

/** Number of distinct background models supporting the result at the selected q cutoff. */
export function modelAgreement(
  result: InteractionResult,
  qThreshold = DEFAULT_Q_THRESHOLD,
): number {
  return result.matches.filter(
    ({ bmr, row }) =>
      isSignificant(row, qThreshold) &&
      !(bmr === "mutsig" && result.mutsigFallbackFeatures.length > 0),
  ).length;
}

export function findResult(data: CohortData, selection: PairSelection): InteractionResult | null {
  const indexes = cohortIndexes(data);
  const id = resultId(selection.direction, selection.ga, selection.gb);
  for (const bmr of BMR_IDS) {
    const row = indexes.byModel[bmr].get(id);
    if (row && isDirection(row)) return toResult(data, row);
  }
  return null;
}

export function findResultForMode(
  data: CohortData,
  selection: PairSelection,
  mode: AtlasMode,
  filter: ResultFilter = {},
): InteractionResult | null {
  if (mode === "consensus") {
    return consensusResults(data, selection.direction, filter).find(
      ({ id }) => id === resultId(selection.direction, selection.ga, selection.gb),
    ) ?? null;
  }
  const row = cohortIndexes(data).byModel[mode].get(
    resultId(selection.direction, selection.ga, selection.gb),
  );
  if (!row || !isDirection(row) || isSameBaseGene(row)) return null;
  const { qThreshold = DEFAULT_Q_THRESHOLD, significantOnly = true } = filter;
  if (significantOnly && !isSignificant(row, qThreshold)) return null;
  return toResult(data, row);
}

export function resultIsSignificant(
  result: InteractionResult,
  mode: AtlasMode,
  qThreshold = DEFAULT_Q_THRESHOLD,
): boolean {
  if (mode === "consensus") {
    return (
      result.matches.length === BMR_IDS.length &&
      result.mutsigFallbackFeatures.length === 0 &&
      result.matches.every(({ row }) => isSignificant(row, qThreshold))
    );
  }
  const match = result.matches.find(({ bmr }) => bmr === mode);
  return match != null && isSignificant(match.row, qThreshold);
}

export const fmtInt = (value: number) => value.toLocaleString("en-US");
export const fmtStat = (value: number, digits = 3) => value.toFixed(digits);
export const fmtQ = (value: number | null) => {
  if (value == null) return "not reported";
  if (value < 0.0001) return value.toExponential(1);
  return value.toFixed(4);
};
