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

describe("ExploreView zero state", () => {
  it("offers callback-driven recovery without referring to the removed strict setting", () => {
    const onDirectionChange = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <ExploreView
        data={emptyData}
        mode="cbase"
        display="list"
        direction="ME"
        onDisplayChange={() => undefined}
        onDirectionChange={onDirectionChange}
        onOpenSettings={onOpenSettings}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText("No significant pairs in this view.")).toBeInTheDocument();
    expect(screen.queryByText(/strict/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show both directions" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose another model" }));
    expect(onDirectionChange).toHaveBeenCalledWith("all");
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });
});
