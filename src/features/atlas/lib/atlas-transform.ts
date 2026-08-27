import {
  BMR_IDS,
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
    fdrSupport: matches.filter((match) => match.row.q != null && match.row.q < 0.01).length,
    mutsigFallbackFeatures: pairEvidence.some(({ bmr }) => bmr === "mutsig")
      ? mutsigFallbackForPair(data, representative.ga, representative.gb)
      : [],
    worstPercentile: percentiles.length ? Math.max(...percentiles) : 1,
    medianPercentile: median(percentiles),
  };
}

/**
 * Exact three-BMR consensus: same gene-effect pair and direction in all models. Results are
 * ordered conservatively by the worst directional rank percentile, then the median percentile.
 */
export function consensusResults(data: CohortData, direction: Direction, strict = false): InteractionResult[] {
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
    if (strict && result.fdrSupport !== BMR_IDS.length) continue;
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
  strict = false,
): InteractionResult[] {
  const results = data.models[bmr]
    .filter((row): row is DialectRow & { direction: Direction } => isDirection(row))
    .filter((row) => row.direction === direction && !isSameBaseGene(row))
    .map((row) => toResult(data, row))
    .filter((result) => !strict || result.fdrSupport === BMR_IDS.length);

  return results.sort(
    (a, b) =>
      a.representative.rank - b.representative.rank || codePointCompare(a.id, b.id),
  );
}

export function resultsForMode(
  data: CohortData,
  mode: AtlasMode,
  direction: Direction,
  strict = false,
): InteractionResult[] {
  return mode === "consensus"
    ? consensusResults(data, direction, strict)
    : modelResults(data, mode, direction, strict);
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
  strict: boolean,
): InteractionResult | null {
  const result = findResult(data, selection);
  if (!result || isSameBaseGene(result)) return null;
  if (strict && result.fdrSupport !== BMR_IDS.length) return null;
  if (mode === "consensus") {
    return result.matches.length === BMR_IDS.length &&
      mutsigFallbackForPair(data, result.ga, result.gb).length === 0
      ? result
      : null;
  }
  return result.matches.some((match) => match.bmr === mode) ? result : null;
}

export const fmtInt = (value: number) => value.toLocaleString("en-US");
export const fmtStat = (value: number, digits = 3) => value.toFixed(digits);
export const fmtQ = (value: number | null) => {
  if (value == null) return "not reported";
  if (value < 0.0001) return value.toExponential(1);
  return value.toFixed(4);
};
