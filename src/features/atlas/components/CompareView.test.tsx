import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CompareView } from "@/features/atlas/components/CompareView";
import {
  buildComparisonRows,
  comparisonMethods,
  sortComparisonRows,
} from "@/features/atlas/components/compare-detail";
import type {
  BaselineRow,
  Bmr,
  CohortData,
  DialectRow,
  ReleaseManifest,
  TransportDirection,
} from "@/features/atlas/types";

function modelRow(
  ga: string,
  gb: string,
  direction: TransportDirection,
  rank: number,
  q: number | null,
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
    rho: direction === "ME" ? -0.4 : 0.33,
    logOddsRatio: null,
    lrt: direction === "CO" ? 8 : 2,
    wald: null,
    p: q,
    q,
    direction,
    rank,
    tauMass: 1,
    effectiveN: 100,
    excludedSamples: 0,
  };
}

function baseline(
  ga: string,
  gb: string,
  overrides: Partial<BaselineRow>,
): BaselineRow {
  return {
    ga,
    gb,
    fisherMeP: null,
    fisherCoP: null,
    fisherMeQ: null,
    fisherCoQ: null,
    discoverMeP: null,
    discoverCoP: null,
    discoverMeQ: null,
    discoverCoQ: null,
    megsaScore: null,
    megsaP: null,
    megsaQ: null,
    wesmeP: null,
    wescoP: null,
    wesmeQ: null,
    wescoQ: null,
    ...overrides,
  };
}

function fixture(): CohortData {
  const models: Record<Bmr, DialectRow[]> = {
    cbase: [
      modelRow("A_M", "B_N", "ME", 4, 0.02),
      modelRow("C_M", "D_N", "ME", 1, 0.002),
      modelRow("K_M", "L_N", "ME", 2, 0.002),
      modelRow("SAME_M", "SAME_N", "ME", 3, 0.0001),
    ],
    dig: [
      modelRow("B_N", "A_M", "ME", 1, 0.001),
      modelRow("C_M", "D_N", "CO", 1, 0.001),
    ],
    mutsig: [modelRow("E_M", "F_N", "ME", 1, 0.003)],
  };
  return {
    id: "test",
    drivers: [],
    models,
    baselines: [
      baseline("G_M", "H_N", { fisherMeQ: 0.0005 }),
      baseline("J_M", "Q_N", { fisherMeQ: 0.4, discoverMeQ: 0.002 }),
      baseline("P_M", "R_N", { fisherMeQ: 0.4, discoverMeQ: 0.5 }),
    ],
    mutsigCbaseFallbackFeatures: [],
  };
}

const manifestMethods = {
  dialect: { directions: ["ME", "CO"] },
  fisher: { directions: ["ME", "CO"] },
  discover: { directions: ["ME", "CO"] },
  megsa: { directions: ["ME"] },
  wesme_wesco: { directions: ["ME", "CO"] },
} satisfies ReleaseManifest["methods"];

describe("comparison row construction and sorting", () => {
  it("uses the significant union, excludes same-base pairs, and keeps missing values last", () => {
    const methods = comparisonMethods("ME", manifestMethods);
    const rows = buildComparisonRows(fixture(), "ME", methods);

    expect(rows.map(({ ga, gb }) => `${ga}/${gb}`)).toEqual([
      "A_M/B_N",
      "C_M/D_N",
      "E_M/F_N",
      "G_M/H_N",
      "J_M/Q_N",
      "K_M/L_N",
    ]);
    expect(rows.some(({ ga }) => ga === "SAME_M")).toBe(false);
    expect(rows.some(({ ga }) => ga === "P_M")).toBe(false);

    const ascending = sortComparisonRows(rows, "cbase", "ascending");
    expect(ascending.slice(0, 3).map(({ ga }) => ga)).toEqual(["C_M", "K_M", "A_M"]);
    expect(ascending.slice(3).map(({ ga }) => ga)).toEqual(["E_M", "G_M", "J_M"]);

    const descending = sortComparisonRows(rows, "cbase", "descending");
    expect(descending.slice(0, 3).map(({ ga }) => ga)).toEqual(["A_M", "C_M", "K_M"]);
    expect(descending.slice(3).map(({ ga }) => ga)).toEqual(["E_M", "G_M", "J_M"]);
  });

  it("exposes clickable, two-way sortable headers with stable ties", async () => {
    const user = userEvent.setup();
    render(
      <CompareView
        data={fixture()}
        manifestMethods={manifestMethods}
        qThreshold={0.01}
        direction="ME"
        onDirectionChange={vi.fn()}
        customize={<button type="button">Customize</button>}
        likelyPassengers={new Set()}
        highlightLikelyPassengers={false}
        onSelect={vi.fn()}
      />,
    );

    const meSection = screen.getByRole("region", { name: "Mutually exclusive" });
    expect(screen.queryByRole("region", { name: "Co-occurring" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Mutually exclusive" })).toBeChecked();
    expect(within(meSection).getByRole("combobox", { name: "Sort ME comparison by" }))
      .toHaveClass("w-full", "sm:w-auto");
    const table = within(meSection).getByRole("table");
    const cbaseHeader = within(table)
      .getByRole("button", { name: "Sort by CBaSE" })
      .closest("th");
    expect(cbaseHeader).not.toBeNull();
    expect(cbaseHeader).toHaveAttribute("aria-sort", "ascending");
    expect(
      within(table).getAllByRole("row").slice(1, 4).map((row) => row.textContent),
    ).toEqual(expect.arrayContaining([expect.stringContaining("C_M / D_N")]));

    await user.click(within(table).getByRole("button", { name: "Sort by Fisher" }));
    const fisherHeader = within(table)
      .getByRole("button", { name: "Sort by Fisher" })
      .closest("th");
    expect(fisherHeader).not.toBeNull();
    expect(fisherHeader).toHaveAttribute("aria-sort", "ascending");
    let bodyRows = within(table).getAllByRole("row").slice(1);
    expect(bodyRows[0]).toHaveTextContent("G_M / H_N");
    expect(bodyRows[1]).toHaveTextContent("J_M / Q_N");
    expect(bodyRows.slice(2).map((row) => row.textContent)).toEqual([
      expect.stringContaining("A_M / B_N"),
      expect.stringContaining("C_M / D_N"),
      expect.stringContaining("E_M / F_N"),
      expect.stringContaining("K_M / L_N"),
    ]);

    await user.click(within(table).getByRole("button", { name: "Sort by Fisher" }));
    expect(fisherHeader).toHaveAttribute("aria-sort", "descending");
    bodyRows = within(table).getAllByRole("row").slice(1);
    expect(bodyRows[0]).toHaveTextContent("J_M / Q_N");
    expect(bodyRows[1]).toHaveTextContent("G_M / H_N");
    expect(bodyRows[2]).toHaveTextContent("A_M / B_N");
  });

  it("names likely-passenger annotations in both responsive renderers", () => {
    render(
      <CompareView
        data={fixture()}
        manifestMethods={manifestMethods}
        qThreshold={0.01}
        direction="ME"
        onDirectionChange={vi.fn()}
        customize={<button type="button">Customize</button>}
        likelyPassengers={new Set(["A_M"])}
        highlightLikelyPassengers
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getAllByText("Likely passenger gene effect: A_M"),
    ).toHaveLength(2);
  });
});
