import type { ElementDefinition } from "cytoscape";
import type { Atlas, Bmr, Cohort, Direction, DirFilter, Edge, Row } from "@/features/atlas/types";

export const STUDY_LABEL: Record<string, string> = {
  TCGA: "TCGA PanCan Atlas",
  "MSK-IMPACT": "MSK-IMPACT",
  "MSK-CHORD": "MSK-CHORD",
};

export const BMR_LABEL: Record<Bmr, string> = {
  cbase: "CBaSE",
  dig: "Dig",
  mutsig: "MutSigCV2",
};
export const BMR_SUB: Record<Bmr, string> = {
  cbase: "per-gene",
  dig: "per-gene",
  mutsig: "sample-specific",
};

/**
 * Likely-passenger genes: long-gene / hypermutation artifacts that dominate the raw
 * top-K (esp. CO at ρ≈0.99). UI-side filter, excluded by default. (Roadmap for a
 * canonical source-side eps/MAF/length filter lives in REDESIGN.md.)
 */
export const PASSENGER_GENES: ReadonlySet<string> = new Set([
  "TTN",
  "MUC16",
  "HMCN1",
  "RYR2",
  "FLG",
  "USH2A",
  "CSMD3",
  "LRP1B",
  "PCLO",
  "OBSCN",
  "SYNE1",
  "NEB",
  "DST",
]);

/** Strip the trailing _M / _N effect suffix to recover the base gene symbol. */
export function baseGene(g: string): string {
  return g.replace(/_[MN]$/, "");
}

/** True if either endpoint of the edge is a likely-passenger gene (suffix-insensitive). */
export function isPassengerEdge(e: Edge): boolean {
  return PASSENGER_GENES.has(baseGene(e.ga)) || PASSENGER_GENES.has(baseGene(e.gb));
}

/** Expand a direction filter to the concrete directions it covers ("both" → ME then CO). */
export const dirs = (d: DirFilter): Direction[] => (d === "both" ? ["ME", "CO"] : [d]);

/** Stable, order-independent key for a gene-effect pair (matches NetworkView edge ids). */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join("|");
}

/** Counts for a cohort under one BMR (after the eps-filter), used by the cross-BMR strip. */
export function bmrCounts(c: Cohort, bmr: Bmr): { ME: number; CO: number } {
  const b = c.bmrs[bmr];
  return { ME: b?.ME.n_total ?? 0, CO: b?.CO.n_total ?? 0 };
}

/**
 * Cross-model robustness: how many of the cohort's available BMR models contain this exact
 * GENE-EFFECT pair in the given direction. `ga`/`gb` are the suffixed gene-effects (e.g.
 * TP53_M, PIK3CA_N) — matching at base-gene granularity over-counts, since TP53_M:PIK3CA_M
 * and TP53_N:PIK3CA_M are distinct dependencies. Pure: depends only on the cohort + atlas.bmrs.
 */
export function replicatedIn(
  c: Cohort,
  atlas: Atlas,
  ga: string,
  gb: string,
  type: Direction,
): number {
  const key = pairKey(ga, gb);
  let n = 0;
  for (const bmr of atlas.bmrs) {
    const dd = c.bmrs[bmr]?.[type];
    if (dd && dd.edges.some((e) => pairKey(e.ga, e.gb) === key)) n++;
  }
  return n;
}

/**
 * Flat list of annotated edge rows for the table (gene-effect level, top-K per direction).
 *
 * When `excludePassengers` is true, likely-passenger edges are dropped BEFORE taking top-K
 * so the top-K is clean. When false, they are kept and flagged `isPassenger: true`.
 *
 * Pure function (atlas/cohort treated as read-only).
 */
export function tableRows(
  c: Cohort,
  bmr: Bmr,
  dir: DirFilter,
  topk: number,
  excludePassengers: boolean,
  atlas: Atlas,
): Row[] {
  const b = c.bmrs[bmr];
  if (!b) return [];
  const rows: Row[] = [];
  for (const d of dirs(dir)) {
    const pool = excludePassengers ? b[d].edges.filter((e) => !isPassengerEdge(e)) : b[d].edges;
    for (const e of pool.slice(0, topk)) {
      rows.push({
        ...e,
        type: d,
        isPassenger: isPassengerEdge(e),
        replicatedIn: replicatedIn(c, atlas, e.ga, e.gb, d),
      });
    }
  }
  return rows;
}

/**
 * Cytoscape elements at GENE-EFFECT granularity. Nodes are keyed by the suffixed symbol
 * (ga/gb, e.g. TP53_M) — not the base gene — so node identity matches the table exactly and
 * two distinct effects of one gene (TP53_M vs TP53_N) stay separate nodes instead of merging.
 * Node `label` carries the suffixed symbol; driver coloring matches on the base gene (the
 * cohort driver list is base-symbol). Node size ~ marginal driver prob; dedup'd ME/CO edges.
 */
export function buildElements(
  c: Cohort,
  bmr: Bmr,
  dir: DirFilter,
  topk: number,
  excludePassengers: boolean,
): { elements: ElementDefinition[]; minW: number; maxW: number; empty: boolean } {
  const b = c.bmrs[bmr];
  if (!b) return { elements: [], minW: 0, maxW: 1, empty: true };
  const driverSet = new Set(c.drivers); // base symbols
  const weight = new Map<string, number>();
  const seen = new Set<string>();
  const edges: ElementDefinition[] = [];

  for (const d of dirs(dir)) {
    const pool = excludePassengers ? b[d].edges.filter((e) => !isPassengerEdge(e)) : b[d].edges;
    for (const e of pool.slice(0, topk)) {
      const key = pairKey(e.ga, e.gb); // suffixed gene-effect pair id
      if (seen.has(key)) continue; // ME wins ties (iterated first)
      seen.add(key);
      edges.push({
        data: {
          id: key,
          source: e.ga,
          target: e.gb,
          type: d,
          effect: Math.abs(e.rho),
          lrt: e.lrt,
          rho: e.rho,
        },
      });
      weight.set(e.ga, Math.max(weight.get(e.ga) ?? 0, e.ta));
      weight.set(e.gb, Math.max(weight.get(e.gb) ?? 0, e.tb));
    }
  }

  const ws = [...weight.values()];
  const minW = ws.length ? Math.min(...ws) : 0;
  const maxW = ws.length ? Math.max(...ws) : 1;
  const nodes: ElementDefinition[] = [...weight].map(([id, w]) => ({
    data: { id, label: id, w, driver: driverSet.has(baseGene(id)) },
  }));

  return { elements: [...nodes, ...edges], minW, maxW, empty: nodes.length === 0 };
}
