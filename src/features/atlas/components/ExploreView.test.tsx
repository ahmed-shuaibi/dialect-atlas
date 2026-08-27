import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ExploreView } from "@/features/atlas/components/ExploreView";
import type { CohortData } from "@/features/atlas/types";

const emptyData: CohortData = {
  id: "empty",
  drivers: [],
  models: { cbase: [], dig: [], mutsig: [] },
  baselines: [],
  mutsigCbaseFallbackFeatures: [],
};

describe("ExploreView", () => {
  it("offers one-step recovery when the significant-only filter has no results", () => {
    const onSignificantOnlyChange = vi.fn();
    render(
      <ExploreView
        data={emptyData}
        mode="consensus"
        display="list"
        qThreshold={0.01}
        significantOnly
        onDisplayChange={() => undefined}
        onSignificantOnlyChange={onSignificantOnlyChange}
        customize={<button type="button">Customize</button>}
        likelyPassengers={new Set()}
        highlightLikelyPassengers={false}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("No pairs meet q < 0.01.")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Explore display" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /significant interactions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /direction/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show ranked pairs" }));
    expect(onSignificantOnlyChange).toHaveBeenCalledWith(false);
  });

  it("uses a compact gene search with a clear recovery action", () => {
    render(
      <ExploreView
        data={emptyData}
        mode="cbase"
        display="list"
        qThreshold={0.005}
        significantOnly={false}
        onDisplayChange={() => undefined}
        onSignificantOnlyChange={() => undefined}
        customize={<button type="button">Customize</button>}
        likelyPassengers={new Set()}
        highlightLikelyPassengers={false}
        onSelect={() => undefined}
      />,
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Find a gene" }), {
      target: { value: "TP53" },
    });
    expect(screen.getByText("No pairs match that gene.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(screen.getByRole("searchbox", { name: "Find a gene" })).toHaveValue("");
  });
});
