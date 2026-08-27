import { describe, expect, it } from "vitest";
import { DataContractError, decodeCohort } from "@/features/atlas/lib/decode";

const DIALECT_FIELDS = [
  "ga",
  "gb",
  "tau00",
  "tau10",
  "tau01",
  "tau11",
  "observed_both",
  "observed_b_only",
  "observed_a_only",
  "observed_neither",
  "tau1x",
  "taux1",
  "rho",
  "log_odds_ratio",
  "lrt",
  "wald",
  "p",
  "q",
  "direction",
  "rank",
  "tau_mass",
  "effective_n",
  "excluded_samples",
];

const BASELINE_FIELDS = [
  "ga",
  "gb",
  "fisher_me_p",
  "fisher_co_p",
  "fisher_me_q",
  "fisher_co_q",
  "discover_me_p",
  "discover_co_p",
  "discover_me_q",
  "discover_co_q",
  "megsa_lrt",
  "megsa_p",
  "megsa_q",
  "wesme_p",
  "wesco_p",
  "wesme_q",
  "wesco_q",
];

const row = (direction: "ME" | "CO" | "neutral" = "ME") => [
  "TP53_M",
  "KRAS_M",
  0.8,
  0.1,
  0.1,
  0,
  2,
  5,
  8,
  85,
  0.1,
  0.08,
  direction === "ME" ? -0.4 : 0,
  null,
  -1e-8,
  null,
  1,
  1,
  direction,
  1,
  1,
  100,
  0,
];

describe("decodeCohort", () => {
  it("decodes positional transport into named values without losing boundary nulls", () => {
    const decoded = decodeCohort({
      id: "TCGA__LUAD",
      drivers: ["TP53"],
      models: {
        cbase: { fields: DIALECT_FIELDS, rows: [row("neutral")] },
        dig: { fields: DIALECT_FIELDS, rows: [] },
        mutsig: { fields: DIALECT_FIELDS, rows: [] },
      },
      baselines: {
        fields: BASELINE_FIELDS,
        rows: [["TP53_M", "KRAS_M", 0.2, 0.3, 0.4, 0.5, null, null, null, null, 8.2, 0.0004, 0.02, 0.1, 0.2, 0.3, 0.4]],
      },
      testing_universes: {
        models: { mutsig: { origins: { cbase_fallback: ["KRAS_M"] } } },
      },
    });

    expect(decoded.models.cbase[0]).toMatchObject({
      direction: "neutral",
      observedBoth: 2,
      observedBOnly: 5,
      observedAOnly: 8,
      observedNeither: 85,
      lrt: -1e-8,
      logOddsRatio: null,
      wald: null,
      tauMass: 1,
      effectiveN: 100,
      excludedSamples: 0,
    });
    expect(decoded.mutsigCbaseFallbackFeatures).toEqual(["KRAS_M"]);
    expect(decoded.baselines[0].megsaScore).toBe(8.2);
  });

  it("rejects malformed compact rows at the transport boundary", () => {
    expect(() =>
      decodeCohort({
        id: "bad",
        drivers: [],
        models: { cbase: { fields: DIALECT_FIELDS, rows: [["too short"]] } },
        baselines: { fields: BASELINE_FIELDS, rows: [] },
      }),
    ).toThrow(DataContractError);
  });

  it("fails closed when a required BMR or baseline table is missing", () => {
    expect(() =>
      decodeCohort({
        id: "bad",
        drivers: [],
        models: {
          cbase: { fields: DIALECT_FIELDS, rows: [] },
          dig: { fields: DIALECT_FIELDS, rows: [] },
        },
        baselines: { fields: BASELINE_FIELDS, rows: [] },
      }),
    ).toThrow(/mutsig/);
    expect(() =>
      decodeCohort({
        id: "bad",
        drivers: [],
        models: {
          cbase: { fields: DIALECT_FIELDS, rows: [] },
          dig: { fields: DIALECT_FIELDS, rows: [] },
          mutsig: { fields: DIALECT_FIELDS, rows: [] },
        },
      }),
    ).toThrow(/baselines/);
  });
});

export { BASELINE_FIELDS, DIALECT_FIELDS, row as dialectTransportRow };
