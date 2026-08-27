import {
  BMR_LABEL,
  baseGene,
  codePointCompare,
  findResult,
  pairKey,
} from "@/features/atlas/lib/atlas-transform";
import {
  BMR_IDS,
  type BaselineRow,
  type Bmr,
  type CohortData,
  type DialectRow,
  type Direction,
  type InteractionResult,
} from "@/features/atlas/types";

export type CompareMethodId = Bmr | "fisher" | "discover" | "megsa" | "wes";
export type CompareSortDirection = "ascending" | "descending";

export type CompareMethod = {
  id: CompareMethodId;
  label: string;
  measure: "q" | "p";
  threshold: number;
};

export type CompareEvidence = {
  method: CompareMethod;
  tested: boolean;
  value: number | null;
  supported: boolean;
  assignedDirection?: DialectRow["direction"];
  fallback?: boolean;
};

export type ComparisonRow = {
  id: string;
  ga: string;
  gb: string;
  result: InteractionResult | null;
  evidence: Record<CompareMethodId, CompareEvidence | undefined>;
  stableIndex: number;
};

function normalizeMethod(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function methodTokens(value: unknown): Set<string> {
  const tokens = new Set<string>();
  const add = (item: unknown) => {
    if (typeof item === "string") {
      tokens.add(normalizeMethod(item));
      return;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      add(record.id ?? record.name ?? record.method ?? record.label);
    }
  };
  if (Array.isArray(value)) value.forEach(add);
  else if (value && typeof value === "object") {
    Object.keys(value as Record<string, unknown>).forEach(add);
  }
  if (tokens.has("wesmewesco")) {
    tokens.add("wesme");
    tokens.add("wesco");
  }
  return tokens;
}

function methodAvailable(tokens: Set<string>, name: string): boolean {
  if (tokens.size === 0) return true;
  const target = normalizeMethod(name);
  return [...tokens].some(
    (token) => token === target || token.includes(target) || target.includes(token),
  );
}

export function comparisonMethods(
  direction: Direction,
  manifestMethods: unknown,
): CompareMethod[] {
  const tokens = methodTokens(manifestMethods);
  const methods: CompareMethod[] = BMR_IDS.map((id) => ({
    id,
    label: BMR_LABEL[id],
    measure: "q" as const,
    threshold: 0.01,
  }));
  if (methodAvailable(tokens, "fisher")) {
    methods.push({ id: "fisher", label: "Fisher", measure: "q", threshold: 0.01 });
  }
  if (methodAvailable(tokens, "discover")) {
    methods.push({ id: "discover", label: "DISCOVER", measure: "q", threshold: 0.01 });
  }
  if (direction === "ME" && methodAvailable(tokens, "megsa")) {
    methods.push({ id: "megsa", label: "MEGSA", measure: "p", threshold: 0.001 });
  }
  const wesName = direction === "ME" ? "wesme" : "wesco";
  if (methodAvailable(tokens, wesName)) {
    methods.push({
      id: "wes",
      label: direction === "ME" ? "WeSME" : "WeSCO",
      measure: "q",
      threshold: 0.01,
    });
  }
  return methods;
}

function baselineValue(
  row: BaselineRow,
  method: Exclude<CompareMethodId, Bmr>,
  direction: Direction,
): number | null {
  if (method === "fisher") return direction === "ME" ? row.fisherMeQ : row.fisherCoQ;
  if (method === "discover") return direction === "ME" ? row.discoverMeQ : row.discoverCoQ;
  if (method === "megsa") return direction === "ME" ? row.megsaP : null;
  return direction === "ME" ? row.wesmeQ : row.wescoQ;
}

function canonicalGenes(ga: string, gb: string): [string, string] {
  return codePointCompare(ga, gb) <= 0 ? [ga, gb] : [gb, ga];
}

function lowestRankByPair(rows: DialectRow[]): Map<string, DialectRow> {
  const byPair = new Map<string, DialectRow>();
  rows.forEach((row) => {
    if (baseGene(row.ga) === baseGene(row.gb)) return;
    const key = pairKey(row.ga, row.gb);
    const prior = byPair.get(key);
    if (!prior || row.rank < prior.rank) byPair.set(key, row);
  });
  return byPair;
}

export function buildComparisonRows(
  data: CohortData,
  direction: Direction,
  methods: CompareMethod[],
): ComparisonRow[] {
  const modelRows = Object.fromEntries(
    BMR_IDS.map((bmr) => [bmr, lowestRankByPair(data.models[bmr])]),
  ) as Record<Bmr, Map<string, DialectRow>>;
  const baselines = new Map<string, BaselineRow>();
  data.baselines.forEach((row) => {
    if (baseGene(row.ga) !== baseGene(row.gb)) baselines.set(pairKey(row.ga, row.gb), row);
  });
  const fallbacks = new Set(data.mutsigCbaseFallbackFeatures);
  const candidates = new Set<string>();

  methods.forEach((method) => {
    if (BMR_IDS.includes(method.id as Bmr)) {
      modelRows[method.id as Bmr].forEach((row, key) => {
        if (row.direction === direction && row.q != null && row.q < method.threshold) {
          candidates.add(key);
        }
      });
      return;
    }
    baselines.forEach((row, key) => {
      const value = baselineValue(
        row,
        method.id as Exclude<CompareMethodId, Bmr>,
        direction,
      );
      if (value != null && value < method.threshold) candidates.add(key);
    });
  });

  return [...candidates]
    .sort(codePointCompare)
    .map((key, stableIndex) => {
      const [rawA, rawB] = key.split("::");
      const [ga, gb] = canonicalGenes(rawA, rawB);
      const evidence = {} as Record<CompareMethodId, CompareEvidence | undefined>;
      methods.forEach((method) => {
        if (BMR_IDS.includes(method.id as Bmr)) {
          const row = modelRows[method.id as Bmr].get(key);
          const value = row?.q ?? null;
          evidence[method.id] = {
            method,
            tested: row != null,
            value,
            supported:
              row?.direction === direction && value != null && value < method.threshold,
            assignedDirection: row?.direction,
            fallback:
              method.id === "mutsig" &&
              row != null &&
              (fallbacks.has(row.ga) || fallbacks.has(row.gb)),
          };
          return;
        }
        const baseline = baselines.get(key);
        const value = baseline
          ? baselineValue(
              baseline,
              method.id as Exclude<CompareMethodId, Bmr>,
              direction,
            )
          : null;
        evidence[method.id] = {
          method,
          tested: value != null,
          value,
          supported: value != null && value < method.threshold,
        };
      });
      return {
        id: `${direction}::${key}`,
        ga,
        gb,
        result: findResult(data, { direction, ga, gb }),
        evidence,
        stableIndex,
      };
    });
}

export function sortComparisonRows(
  rows: ComparisonRow[],
  method: CompareMethodId,
  direction: CompareSortDirection,
): ComparisonRow[] {
  const multiplier = direction === "ascending" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const aValue = a.evidence[method]?.value ?? null;
    const bValue = b.evidence[method]?.value ?? null;
    if (aValue == null && bValue == null) return a.stableIndex - b.stableIndex;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    const byValue = (aValue - bValue) * multiplier;
    return byValue || a.stableIndex - b.stableIndex;
  });
}
