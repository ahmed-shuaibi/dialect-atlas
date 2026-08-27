import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SettingsDrawer } from "@/features/atlas/components/SettingsDrawer";
import type { BmrCount } from "@/features/atlas/types";

function DrawerHarness({ showConsensusThresholds = true }) {
  const [minIdentifiedBmrs, setMinIdentifiedBmrs] = useState<BmrCount>(3);
  const [minSignificantBmrs, setMinSignificantBmrs] = useState<BmrCount>(3);

  return (
    <SettingsDrawer
      open
      showConsensusThresholds={showConsensusThresholds}
      mode="consensus"
      qThreshold={0.01}
      minIdentifiedBmrs={minIdentifiedBmrs}
      minSignificantBmrs={minSignificantBmrs}
      highlightLikelyPassengers={false}
      onOpenChange={vi.fn()}
      onModeChange={vi.fn()}
      onQThresholdChange={vi.fn()}
      onMinIdentifiedBmrsChange={setMinIdentifiedBmrs}
      onMinSignificantBmrsChange={setMinSignificantBmrs}
      onHighlightLikelyPassengersChange={vi.fn()}
    />
  );
}

describe("SettingsDrawer consensus thresholds", () => {
  it("uses a pure right-edge sidebar transition", () => {
    render(<DrawerHarness />);

    expect(screen.getByRole("dialog", { name: "Customize" })).toHaveClass(
      "left-auto",
      "right-0",
      "top-0",
      "data-[state=open]:slide-in-from-right",
      "data-[state=closed]:slide-out-to-right",
    );
    expect(screen.getByRole("dialog", { name: "Customize" })).not.toHaveClass(
      "data-[state=open]:slide-in-from-bottom",
      "data-[state=closed]:slide-out-to-bottom",
    );
  });

  it("exposes independent, keyboard-operable 1/2/3 radiogroups", async () => {
    const user = userEvent.setup();
    render(<DrawerHarness />);

    const identified = screen.getByRole("radiogroup", {
      name: "Minimum BMRs identifying this interaction",
    });
    const significant = screen.getByRole("radiogroup", {
      name: "Minimum BMRs significant at the q cutoff",
    });
    expect(within(identified).getAllByRole("radio")).toHaveLength(3);
    expect(within(significant).getAllByRole("radio")).toHaveLength(3);
    expect(within(identified).getByRole("radio", { name: "3" })).toBeChecked();
    expect(within(significant).getByRole("radio", { name: "3" })).toBeChecked();

    await user.click(within(significant).getByRole("radio", { name: "1" }));
    expect(within(significant).getByRole("radio", { name: "1" })).toBeChecked();
    expect(within(identified).getByRole("radio", { name: "3" })).toBeChecked();

    within(identified).getByRole("radio", { name: "3" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(within(identified).getByRole("radio", { name: "2" })).toBeChecked();
    expect(within(significant).getByRole("radio", { name: "1" })).toBeChecked();
    await user.keyboard("{Home}");
    expect(within(identified).getByRole("radio", { name: "1" })).toBeChecked();
    await user.keyboard("{End}");
    expect(within(identified).getByRole("radio", { name: "3" })).toBeChecked();

    const audit = await axe.run(document.body, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(audit.violations).toEqual([]);
  });

  it("hides consensus minima outside the consensus Explore surface", () => {
    render(<DrawerHarness showConsensusThresholds={false} />);

    expect(
      screen.queryByRole("radiogroup", {
        name: "Minimum BMRs identifying this interaction",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", {
        name: "Minimum BMRs significant at the q cutoff",
      }),
    ).not.toBeInTheDocument();
  });
});
