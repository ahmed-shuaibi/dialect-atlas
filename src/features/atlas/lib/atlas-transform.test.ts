import { describe, expect, it } from "vitest";
import {
  backgroundSupport,
  consensusResults,
  exploreResults,
  filterResultsByGene,
  findResultForMode,
  isSignificant,
  lrtEvidence,
  modelResults,
  resultIsSignificant,
  resultQ,
} from "@/features/atlas/lib/atlas-transform";
import type { Bmr, CohortData, DialectRow, TransportDirection } from "@/features/atlas/types";

function dialectRow(
  ga: string,
  gb: string,
  direction: TransportDirection,
  rank: number,
  overrides: Partial<DialectRow> = {},
): DialectRow {
  return {
    ga,
    gb,
    tau00: 0.8,
    tau10: 0.1,
    tau01: 0.1,
    tau11: 0,
    observedBoth: 2,
    observedBOnly: 5,
    observedAOnly: 8,
    observedNeither: 85,
    tau1x: 0.1,
    taux1: 0.08,
    rho: direction === "ME" ? -0.25 : direction === "CO" ? 0.25 : 0,
    logOddsRatio: null,
    lrt: direction === "CO" ? 8 : 2,
    wald: null,
    p: 0.01,
    q: 0.001,
    direction,
    rank,
    tauMass: 1,
    effectiveN: 100,
    excludedSamples: 0,
    ...overrides,
  };
}

function data(
  models: Record<Bmr, DialectRow[]>,
  mutsigCbaseFallbackFeatures: string[] = [],
): CohortData {
  return {
    id: "test",
    drivers: [],
    models,
    baselines: [],
    mutsigCbaseFallbackFeatures,
  };
}

describe("Atlas interaction ranking", () => {
  it("builds exact same-direction consensus and orders by worst then median percentile", () => {
    const filler = (bmr: Bmr) => dialectRow(`${bmr}_FILLER_M`, "Z_M", "ME", 100);
    const cohort = data({
      cbase: [
        dialectRow("A_M", "B_M", "ME", 1, { q: 0.001 }),
        dialectRow("C_M", "D_M", "ME", 20, { q: 0.001 }),
        dialectRow("SAME_M", "SAME_N", "ME", 2, { q: 0.001 }),
        dialectRow("N_M", "Q_M", "neutral", 3),
        filler("cbase"),
      ],
      dig: [
        dialectRow("B_M", "A_M", "ME", 100, { q: 0.02 }),
        dialectRow("C_M", "D_M", "ME", 20, { q: 0.001 }),
        dialectRow("SAME_N", "SAME_M", "ME", 2, { q: 0.001 }),
        filler("dig"),
      ],
      mutsig: [
        dialectRow("A_M", "B_M", "ME", 100, { q: 0.001 }),
        dialectRow("D_M", "C_M", "ME", 20, { q: 0.001 }),
        dialectRow("SAME_M", "SAME_N", "ME", 2, { q: 0.001 }),
        filler("mutsig"),
      ],
    });

    const consensus = consensusResults(cohort, "ME");
    expect(consensus.map((result) => result.ga)).toEqual(["C_M"]);
  });

  it("follows stored direction-specific ranks and ignores neutral rows", () => {
    const cohort = data({
      cbase: [
        dialectRow("A_M", "B_M", "ME", 2, { rho: -0.2 }),
        dialectRow("C_M", "D_M", "ME", 1, { rho: -0.6 }),
        dialectRow("E_M", "F_M", "CO", 2, { lrt: -0.02 }),
        dialectRow("G_M", "H_M", "CO", 1, { lrt: 4 }),
        dialectRow("I_M", "J_M", "neutral", 1),
      ],
      dig: [],
      mutsig: [],
    });
    expect(modelResults(cohort, "cbase", "ME").map((result) => result.ga)).toEqual(["C_M", "A_M"]);
    expect(modelResults(cohort, "cbase", "CO").map((result) => result.ga)).toEqual(["G_M", "E_M"]);
    expect(lrtEvidence({ lrt: -0.02 })).toBe(0);
  });

  it("keeps ranking matches direction-qualified while exposing oriented pair evidence", () => {
    const selected = dialectRow("A_M", "B_N", "ME", 1, {
      q: 0.001,
      tau10: 0.11,
      tau01: 0.22,
      observedAOnly: 7,
      observedBOnly: 13,
      tau1x: 0.12,
      taux1: 0.23,
    });
    const opposite = dialectRow("B_N", "A_M", "CO", 7, {
      q: 0.02,
      rho: 0.31,
      lrt: 9,
      tau10: 0.31,
      tau01: 0.17,
      observedAOnly: 19,
      observedBOnly: 23,
      tau1x: 0.34,
      taux1: 0.2,
      effectiveN: 91,
      excludedSamples: 9,
    });
    const neutral = dialectRow("B_N", "A_M", "neutral", 11, {
      q: null,
      rho: 0,
      lrt: 0.4,
    });
    const cohort = data({ cbase: [selected], dig: [opposite], mutsig: [neutral] });

    const [result] = modelResults(cohort, "cbase", "ME");
    expect(result.matches.map(({ bmr }) => bmr)).toEqual(["cbase"]);
    expect(result.pairEvidence.map(({ bmr, row }) => [bmr, row.direction])).toEqual([
      ["cbase", "ME"],
      ["dig", "CO"],
      ["mutsig", "neutral"],
    ]);

    const dig = result.pairEvidence.find(({ bmr }) => bmr === "dig")?.row;
    expect(dig).toMatchObject({
      ga: "A_M",
      gb: "B_N",
      tau10: 0.17,
      tau01: 0.31,
      observedAOnly: 23,
      observedBOnly: 19,
      tau1x: 0.2,
      taux1: 0.34,
      direction: "CO",
      rank: 7,
      effectiveN: 91,
      excludedSamples: 9,
    });
  });

  it("uses immutable stored ranks when single-model statistics are tied", () => {
    const cohort = data({
      cbase: [
        dialectRow("a_M", "Y_M", "ME", 2, { rho: -0.5 }),
        dialectRow("Z_M", "X_M", "ME", 1, { rho: -0.5 }),
        dialectRow("a_N", "Y_N", "CO", 2, { lrt: 8 }),
        dialectRow("Z_N", "X_N", "CO", 1, { lrt: 8 }),
      ],
      dig: [],
      mutsig: [],
    });

    expect(modelResults(cohort, "cbase", "ME").map((result) => result.ga)).toEqual([
      "Z_M",
      "a_M",
    ]);
    expect(modelResults(cohort, "cbase", "CO").map((result) => result.ga)).toEqual([
      "Z_N",
      "a_N",
    ]);
  });

  it("uses locale-independent code-point order for exact consensus ties", () => {
    const pairs = [
      ["Z_M", "ZZ_M"],
      ["a_M", "aa_M"],
      ["A-1_M", "A-2_M"],
    ] as const;
    const rows = (ranks: readonly number[]) =>
      pairs.map(([ga, gb], index) => dialectRow(ga, gb, "ME", ranks[index], { q: 0.001 }));
    const cohort = data({
      cbase: rows([1, 2, 3]),
      dig: rows([2, 3, 1]),
      mutsig: rows([3, 1, 2]),
    });

    expect(consensusResults(cohort, "ME").map((result) => result.ga)).toEqual([
      "A-1_M",
      "Z_M",
      "a_M",
    ]);
  });

  it("excludes CBaSE-backed MutSig features from three-background consensus only", () => {
    const pair = dialectRow("A_M", "B_M", "ME", 1, { q: 0.001 });
    const cohort = data(
      { cbase: [pair], dig: [pair], mutsig: [pair] },
      ["A_M"],
    );

    expect(consensusResults(cohort, "ME")).toEqual([]);
    expect(consensusResults(cohort, "ME")).toEqual([]);
    expect(modelResults(cohort, "mutsig", "ME")).toHaveLength(1);
    expect(
      findResultForMode(
        cohort,
        { direction: "ME", ga: "A_M", gb: "B_M" },
        "consensus",
      ),
    ).toBeNull();
    expect(
      findResultForMode(
        cohort,
        { direction: "ME", ga: "A_M", gb: "B_M" },
        "mutsig",
      ),
    ).not.toBeNull();
  });

  it("does not present endpoint fallback metadata when MutSig did not test the pair", () => {
    const pair = dialectRow("A_M", "B_M", "ME", 1, { q: 0.001 });
    const cohort = data(
      { cbase: [pair], dig: [pair], mutsig: [] },
      ["A_M"],
    );

    const [result] = modelResults(cohort, "cbase", "ME");
    expect(result.pairEvidence.map(({ bmr }) => bmr)).toEqual(["cbase", "dig"]);
    expect(result.mutsigFallbackFeatures).toEqual([]);
  });

  it("indexes a dense K=500-style cohort without quadratic matching", () => {
    const count = 4500;
    const rows = Array.from({ length: count }, (_, index) =>
      dialectRow(`G${index}_M`, `H${index}_N`, "ME", index + 1, { q: 0.001 }),
    );
    const cohort = data({ cbase: rows, dig: [...rows], mutsig: [...rows] });
    const start = performance.now();
    const results = consensusResults(cohort, "ME");
    const elapsed = performance.now() - start;
    expect(results).toHaveLength(count);
    expect(elapsed).toBeLessThan(1500);
  });

  it("does not resolve pair links outside the selected significant model view", () => {
    const pair = { direction: "ME" as const, ga: "A_M", gb: "B_M" };
    const cohort = data({
      cbase: [dialectRow("A_M", "B_M", "ME", 1, { q: 0.001 })],
      dig: [],
      mutsig: [],
    });
    expect(findResultForMode(cohort, pair, "cbase")).not.toBeNull();
    expect(findResultForMode(cohort, pair, "dig")).toBeNull();
    expect(findResultForMode(cohort, pair, "consensus")).toBeNull();
  });

  it("uses a strict dynamic q boundary and excludes missing q values", () => {
    const cohort = data({
      cbase: [
        dialectRow("PASS_M", "A_N", "ME", 1, { q: 0.009999 }),
        dialectRow("BOUNDARY_M", "B_N", "ME", 2, { q: 0.01 }),
        dialectRow("RELAXED_M", "D_N", "ME", 3, { q: 0.049999 }),
        dialectRow("RELAXED_BOUNDARY_M", "E_N", "ME", 4, { q: 0.05 }),
        dialectRow("MISSING_M", "C_N", "ME", 3, { q: null }),
      ],
      dig: [],
      mutsig: [],
    });

    expect(isSignificant({ q: 0.009999 })).toBe(true);
    expect(isSignificant({ q: 0.01 })).toBe(false);
    expect(isSignificant({ q: null })).toBe(false);
    expect(isSignificant({ q: 0.049999 }, 0.05)).toBe(true);
    expect(isSignificant({ q: 0.05 }, 0.05)).toBe(false);
    expect(isSignificant({ q: null }, 0.05)).toBe(false);
    expect(modelResults(cohort, "cbase", "ME").map(({ ga }) => ga)).toEqual(["PASS_M"]);
    expect(
      modelResults(cohort, "cbase", "ME", { qThreshold: 0.05 }).map(({ ga }) => ga),
    ).toEqual(["PASS_M", "BOUNDARY_M", "RELAXED_M"]);
  });

  it("separates ranked candidates from threshold-filtered significant results", () => {
    const cbase = [
      dialectRow("STRICT_M", "A_N", "ME", 1, { q: 0.004 }),
      dialectRow("RELAXED_M", "B_N", "ME", 2, { q: 0.02 }),
      dialectRow("BOUNDARY_M", "C_N", "ME", 3, { q: 0.05 }),
    ];
    const cohort = data({ cbase, dig: [...cbase], mutsig: [...cbase] });

    expect(consensusResults(cohort, "ME").map(({ ga }) => ga)).toEqual(["STRICT_M"]);
    expect(
      consensusResults(cohort, "ME", { qThreshold: 0.05 }).map(({ ga }) => ga),
    ).toEqual(["STRICT_M", "RELAXED_M"]);

    const candidates = consensusResults(cohort, "ME", {
      qThreshold: 0.01,
      significantOnly: false,
    });
    expect(candidates.map(({ ga }) => ga)).toEqual([
      "STRICT_M",
      "RELAXED_M",
      "BOUNDARY_M",
    ]);
    expect(candidates.map((result) => resultIsSignificant(result, "consensus", 0.01))).toEqual([
      true,
      false,
      false,
    ]);
    expect(candidates.map((result) => resultIsSignificant(result, "consensus", 0.05))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it("requires same-direction significance under every model for consensus", () => {
    const cbase = dialectRow("A_M", "B_N", "ME", 1, { q: 0.001 });
    const cohort = data({
      cbase: [cbase],
      dig: [dialectRow("B_N", "A_M", "CO", 1, { q: 0.001 })],
      mutsig: [dialectRow("A_M", "B_N", "ME", 1, { q: 0.001 })],
    });
    expect(consensusResults(cohort, "ME")).toEqual([]);
    expect(modelResults(cohort, "cbase", "ME")).toHaveLength(1);
    expect(modelResults(cohort, "dig", "CO")).toHaveLength(1);
  });

  it("uses the selected model's q and exposes distinct model agreement", () => {
    const cohort = data({
      cbase: [dialectRow("A_M", "B_N", "ME", 1, { q: 0.002 })],
      dig: [dialectRow("A_M", "B_N", "ME", 2, { q: 0.008 })],
      mutsig: [dialectRow("A_M", "B_N", "ME", 3, { q: 0.02 })],
    });
    const [result] = modelResults(cohort, "dig", "ME");
    expect(result.representative.rank).toBe(2);
    expect(resultQ(result, "dig")).toBe(0.008);
    expect(backgroundSupport(result)).toEqual({ significant: 2, independent: 3 });
    expect(backgroundSupport(result, 0.05)).toEqual({ significant: 3, independent: 3 });
    expect(resultIsSignificant(result, "dig", 0.005)).toBe(false);
    expect(resultIsSignificant(result, "dig", 0.01)).toBe(true);
    expect(modelResults(cohort, "mutsig", "ME")).toEqual([]);
    expect(modelResults(cohort, "mutsig", "ME", { qThreshold: 0.05 })).toHaveLength(1);
  });

  it("excludes MutSigCV2 CBaSE fallback from support and its denominator", () => {
    const shared = dialectRow("A_M", "B_N", "ME", 1, { q: 0.001 });
    const cohort = data(
      { cbase: [shared], dig: [shared], mutsig: [shared] },
      ["A_M"],
    );
    const [result] = modelResults(cohort, "cbase", "ME");
    expect(backgroundSupport(result)).toEqual({ significant: 2, independent: 2 });
  });

  it("gives network and list consumers one complete result set", () => {
    const cohort = data({
      cbase: [
        dialectRow("A_M", "B_N", "ME", 1),
        dialectRow("TP53_M", "KRAS_M", "CO", 1),
      ],
      dig: [],
      mutsig: [],
    });
    const results = exploreResults(cohort, "cbase");
    expect(results.map(({ id }) => id)).toEqual([
      "ME::A_M::B_N",
      "CO::KRAS_M::TP53_M",
    ]);
    expect(filterResultsByGene(results, "tp53").map(({ id }) => id)).toEqual([
      "CO::KRAS_M::TP53_M",
    ]);
  });
});
