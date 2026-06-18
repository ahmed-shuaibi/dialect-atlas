import type { ElementDefinition } from "cytoscape";

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
  drivers: string[];
  bmrs: Partial<Record<Bmr, Record<Direction, DirData>>>;
}

export interface Atlas {
  bmrs: Bmr[];
  bmr_label: Record<Bmr, string>;
  cohorts: Cohort[];
}

export const BMR_ORDER: Bmr[] = ["cbase", "dig", "mutsig"];
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

export async function loadAtlas(): Promise<Atlas> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/atlas.json`);
  if (!res.ok) throw new Error(`failed to load atlas.json (${res.status})`);
  return res.json();
}

/** Counts for a cohort under one BMR (after the eps-filter), used by the cross-BMR strip. */
export function bmrCounts(c: Cohort, bmr: Bmr): { ME: number; CO: number } {
  const b = c.bmrs[bmr];
  return { ME: b?.ME.n_total ?? 0, CO: b?.CO.n_total ?? 0 };
}

const dirs = (d: DirFilter): Direction[] => (d === "both" ? ["ME", "CO"] : [d]);

/** Flat list of edge rows for the table (gene-effect level, top-k per direction). */
export function tableRows(
  c: Cohort,
  bmr: Bmr,
  dir: DirFilter,
  topk: number,
): Array<Edge & { type: Direction }> {
  const b = c.bmrs[bmr];
  if (!b) return [];
  const rows: Array<Edge & { type: Direction }> = [];
  for (const d of dirs(dir)) for (const e of b[d].edges.slice(0, topk)) rows.push({ ...e, type: d });
  return rows;
}

/** Cytoscape elements: base-gene nodes (size ~ marginal driver prob), dedup'd ME/CO edges. */
export function buildElements(
  c: Cohort,
  bmr: Bmr,
  dir: DirFilter,
  topk: number,
): { elements: ElementDefinition[]; minW: number; maxW: number; empty: boolean } {
  const b = c.bmrs[bmr];
  if (!b) return { elements: [], minW: 0, maxW: 1, empty: true };
  const driverSet = new Set(c.drivers);
  const weight = new Map<string, number>();
  const seen = new Set<string>();
  const edges: ElementDefinition[] = [];

  for (const d of dirs(dir)) {
    for (const e of b[d].edges.slice(0, topk)) {
      const key = [e.a, e.b].sort().join("|");
      if (seen.has(key)) continue; // ME wins ties (iterated first)
      seen.add(key);
      edges.push({
        data: {
          id: key,
          source: e.a,
          target: e.b,
          type: d,
          effect: Math.abs(e.rho),
          lrt: e.lrt,
          rho: e.rho,
        },
      });
      weight.set(e.a, Math.max(weight.get(e.a) ?? 0, e.ta));
      weight.set(e.b, Math.max(weight.get(e.b) ?? 0, e.tb));
    }
  }

  const ws = [...weight.values()];
  const minW = ws.length ? Math.min(...ws) : 0;
  const maxW = ws.length ? Math.max(...ws) : 1;
  const nodes: ElementDefinition[] = [...weight].map(([id, w]) => ({
    data: { id, w, driver: driverSet.has(id) },
  }));

  return { elements: [...nodes, ...edges], minW, maxW, empty: nodes.length === 0 };
}
