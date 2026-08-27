import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InteractionList } from "@/features/atlas/components/InteractionList";
import type { DialectRow, InteractionResult } from "@/features/atlas/types";

function result(index: number): InteractionResult {
  const direction = index % 2 === 0 ? "ME" : "CO";
  const row = {
    ga: `A${index}_M`,
    gb: `B${index}_N`,
    direction,
    q: 0.001,
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
    matches: [{ bmr: "cbase", row, percentile: (index + 1) / 200 }],
    pairEvidence: [{ bmr: "cbase", row }],
    mutsigFallbackFeatures: [],
    worstPercentile: (index + 1) / 200,
    medianPercentile: (index + 1) / 200,
  };
}

describe("InteractionList", () => {
  it("shows both directions and progressively exposes the complete ranked set", async () => {
    const user = userEvent.setup();
    const results = Array.from({ length: 150 }, (_, index) => result(index));
    const { container } = render(
      <InteractionList results={results} mode="cbase" qThreshold={0.01} onSelect={() => undefined} />,
    );
    expect(screen.getByRole("heading", { name: "Mutually exclusive" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Co-occurring" })).toBeInTheDocument();
    expect(screen.queryByText("Significant")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-result-id]")).toHaveLength(120);
    for (const button of screen.getAllByRole("button", { name: "Show 15 more" })) {
      await user.click(button);
    }
    const listIds = [...container.querySelectorAll<HTMLElement>("[data-result-id]")]
      .map((element) => element.dataset.resultId)
      .sort();
    expect(listIds).toEqual(results.map(({ id }) => id).sort());
    expect(listIds).toHaveLength(150);
  });
});
