import { describe, expect, it } from "vitest";
import { buildNetworkLayout, edgeWidthForQ } from "@/features/atlas/components/network-layout";
import type { DialectRow, InteractionResult } from "@/features/atlas/types";

function result(index: number, q = 0.001): InteractionResult {
  const direction = index % 2 ? "CO" : "ME";
  const row = {
    ga: `G${index}_M`,
    gb: `G${index + 1}_N`,
    direction,
    q,
    rank: index + 1,
    rho: direction === "ME" ? -0.3 : 0.3,
    lrt: 8,
  } as DialectRow;
  return {
    id: `${direction}::${row.ga}::${row.gb}`,
    ga: row.ga,
    gb: row.gb,
    direction,
    representative: row,
    matches: [{ bmr: "cbase", row, percentile: (index + 1) / 100 }],
    pairEvidence: [{ bmr: "cbase", row }],
    fdrSupport: 1,
    mutsigFallbackFeatures: [],
    worstPercentile: (index + 1) / 100,
    medianPercentile: (index + 1) / 100,
  };
}

describe("static interaction network layout", () => {
  it("is deterministic and preserves every result edge", () => {
    const results = Array.from({ length: 200 }, (_, index) => result(index));
    const first = buildNetworkLayout(results, "cbase");
    const second = buildNetworkLayout([...results].reverse(), "cbase");
    expect(first).toEqual(second);
    expect(first.edges.map(({ id }) => id).sort()).toEqual(results.map(({ id }) => id).sort());
    expect(first.nodes).toHaveLength(400);
  });

  it("uses stronger edge weight for smaller q-values", () => {
    expect(edgeWidthForQ(0.000001)).toBeGreaterThan(edgeWidthForQ(0.009));
    expect(edgeWidthForQ(0.01)).toBe(1.5);
  });

  it("returns a sparse zero state without inventing nodes", () => {
    expect(buildNetworkLayout([], "consensus")).toEqual({ nodes: [], edges: [] });
  });
});
