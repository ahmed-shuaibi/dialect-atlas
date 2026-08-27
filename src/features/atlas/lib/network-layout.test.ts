import { describe, expect, it } from "vitest";
import {
  buildNetworkLayout,
  edgeWidthForQ,
} from "@/features/atlas/components/network-layout";
import type { DialectRow, Direction, InteractionResult } from "@/features/atlas/types";

function result({
  id,
  ga,
  gb,
  direction = "ME",
  q = 0.001,
}: {
  id: string;
  ga: string;
  gb: string;
  direction?: Direction;
  q?: number;
}): InteractionResult {
  const row = {
    ga,
    gb,
    direction,
    q,
    rank: 1,
    rho: direction === "ME" ? -0.3 : 0.3,
    lrt: direction === "CO" ? 8 : 0,
  } as DialectRow;
  return {
    id,
    ga,
    gb,
    direction,
    representative: row,
    matches: [{ bmr: "cbase", row, percentile: 0.01 }],
    pairEvidence: [{ bmr: "cbase", row }],
    mutsigFallbackFeatures: [],
    worstPercentile: 0.01,
    medianPercentile: 0.01,
  };
}

describe("interaction network layout", () => {
  const results = [
    result({ id: "ME::A_M::B_N", ga: "A_M", gb: "B_N" }),
    result({ id: "CO::A_M::C_M", ga: "A_M", gb: "C_M", direction: "CO" }),
    result({ id: "ME::B_N::C_M", ga: "B_N", gb: "C_M", q: 0.005 }),
  ];

  it("is deterministic regardless of input ordering and preserves the input", () => {
    const snapshot = structuredClone(results);
    const first = buildNetworkLayout(results, "cbase", 0.01);
    const second = buildNetworkLayout([...results].reverse(), "cbase", 0.01);

    expect(first).toEqual(second);
    expect(first.edges.map(({ id }) => id).sort()).toEqual(results.map(({ id }) => id).sort());
    expect(first.nodes.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(results).toEqual(snapshot);
  });

  it("reports degree only for connections in the supplied display set", () => {
    const layout = buildNetworkLayout(results.slice(0, 2), "cbase", 0.01);
    const degrees = Object.fromEntries(
      layout.nodes.map(({ id, shownDegree }) => [id, shownDegree]),
    );

    expect(degrees).toEqual({ A_M: 2, B_N: 1, C_M: 1 });
    expect(layout.nodes[0]).not.toHaveProperty("degree");
  });

  it("scales edge weight by strength relative to the active q threshold", () => {
    expect(edgeWidthForQ(0.01, 0.01)).toBe(1.5);
    expect(edgeWidthForQ(0.05, 0.05)).toBe(1.5);
    expect(edgeWidthForQ(0.5, 0.05)).toBe(1.5);
    expect(edgeWidthForQ(0.001, 0.01)).toBeCloseTo(edgeWidthForQ(0.005, 0.05));
    expect(edgeWidthForQ(0.001, 0.01)).toBeGreaterThan(edgeWidthForQ(0.005, 0.01));
    expect(edgeWidthForQ(1e-12, 0.05)).toBe(5);
  });

  it("passes the active threshold through to rendered edge widths", () => {
    const edge = result({ id: "ME::A_M::B_N", ga: "A_M", gb: "B_N", q: 0.005 });
    const strict = buildNetworkLayout([edge], "cbase", 0.01).edges[0];
    const relaxed = buildNetworkLayout([edge], "cbase", 0.05).edges[0];

    expect(relaxed.width).toBeGreaterThan(strict.width);
  });

  it("returns an honest empty state", () => {
    expect(buildNetworkLayout([], "consensus", 0.01)).toEqual({ nodes: [], edges: [] });
  });
});
