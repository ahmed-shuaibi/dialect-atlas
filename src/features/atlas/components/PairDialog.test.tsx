import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PairDialog } from "@/features/atlas/components/PairDialog";
import { modelResults } from "@/features/atlas/lib/atlas-transform";
import type { Bmr, CohortData, DialectRow, TransportDirection } from "@/features/atlas/types";

function row(
  ga: string,
  gb: string,
  direction: TransportDirection,
  rank: number,
  overrides: Partial<DialectRow> = {},
): DialectRow {
  return {
    ga,
    gb,
    tau00: 0.7,
    tau10: 0.1,
    tau01: 0.15,
    tau11: 0.05,
    observedBoth: 4,
    observedBOnly: 12,
    observedAOnly: 18,
    observedNeither: 66,
    tau1x: 0.15,
    taux1: 0.2,
    rho: direction === "ME" ? -0.4 : direction === "CO" ? 0.33 : 0,
    logOddsRatio: null,
    lrt: direction === "ME" ? 7 : direction === "CO" ? 8 : 0.25,
    wald: null,
    p: 0.01,
    q: direction === "neutral" ? null : 0.02,
    direction,
    rank,
    tauMass: 1,
    effectiveN: 100,
    excludedSamples: 0,
    ...overrides,
  };
}

function cohort(
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

function dialogFor(data: CohortData) {
  const [result] = modelResults(data, "cbase", "ME");
  return render(
    <PairDialog
      result={result}
      data={data}
      mode="cbase"
      open
      onOpenChange={() => undefined}
    />,
  );
}

describe("PairDialog model evidence", () => {
  it("shows opposite and neutral model directions as real evidence, not missing tests", () => {
    const data = cohort({
      cbase: [row("A_M", "B_N", "ME", 1, { q: 0.001 })],
      dig: [
        row("B_N", "A_M", "CO", 7, {
          rho: 0.33,
          lrt: 8,
          q: 0.02,
          effectiveN: 91,
          excludedSamples: 9,
        }),
      ],
      mutsig: [
        row("B_N", "A_M", "neutral", 11, {
          rho: 0,
          lrt: 0.25,
          q: null,
          effectiveN: 88,
          excludedSamples: 12,
        }),
      ],
    });

    dialogFor(data);

    expect(screen.getByText(/This ME direction was inferred in 1\/3/)).toBeInTheDocument();
    const dig = screen.getByText("DIG").closest("tr");
    const mutsig = screen.getByText("MutSigCV2").closest("tr");
    expect(dig).not.toBeNull();
    expect(mutsig).not.toBeNull();
    expect(within(dig!).getByText("CO")).toBeInTheDocument();
    expect(within(dig!).getByText("0.330")).toBeInTheDocument();
    expect(within(dig!).getByText("8.00")).toBeInTheDocument();
    expect(within(dig!).getByText("0.0200")).toBeInTheDocument();
    expect(within(dig!).getByText("7")).toBeInTheDocument();
    expect(within(dig!).getByText("91/100")).toBeInTheDocument();
    expect(within(mutsig!).getByText("Neutral")).toBeInTheDocument();
    expect(within(mutsig!).getByText("0.000")).toBeInTheDocument();
    expect(within(mutsig!).getByText("0.25")).toBeInTheDocument();
    expect(within(mutsig!).getByText("not reported")).toBeInTheDocument();
    expect(within(mutsig!).getByText("11")).toBeInTheDocument();
    expect(within(mutsig!).getByText("88/100")).toBeInTheDocument();
    expect(screen.queryByText(/Not tested/)).not.toBeInTheDocument();
  });

  it("uses not tested only when a BMR has no row for the pair", () => {
    const data = cohort(
      {
        cbase: [row("A_M", "B_N", "ME", 1)],
        dig: [row("X_M", "Y_N", "CO", 2)],
        mutsig: [],
      },
      ["A_M"],
    );

    dialogFor(data);

    const dig = screen.getByText("DIG").closest("tr");
    const mutsig = screen.getByText("MutSigCV2").closest("tr");
    expect(within(dig!).getByText("Not tested for this pair")).toBeInTheDocument();
    expect(within(mutsig!).getByText("Not tested for this pair")).toBeInTheDocument();
    expect(screen.getAllByText("Not tested for this pair")).toHaveLength(2);
    expect(screen.queryByText(/CBaSE fallback/)).not.toBeInTheDocument();
    expect(screen.queryByText(/reuses the CBaSE background/)).not.toBeInTheDocument();
  });
});
