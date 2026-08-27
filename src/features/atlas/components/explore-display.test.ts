import { describe, expect, it } from "vitest";
import { resultsForNetwork } from "@/features/atlas/components/explore-display";
import type { Direction, InteractionResult } from "@/features/atlas/types";

function result(direction: Direction, index: number): InteractionResult {
  return {
    id: `${direction}::G${index}_M::H${index}_M`,
    ga: `G${index}_M`,
    gb: `H${index}_M`,
    direction,
  } as InteractionResult;
}

describe("dense Explore display", () => {
  it("keeps small networks complete", () => {
    const results = [result("ME", 1), result("CO", 2)];
    expect(resultsForNetwork(results, 10)).toEqual(results);
  });

  it("shows the requested number from each direction", () => {
    const me = Array.from({ length: 10 }, (_, index) => result("ME", index));
    const co = Array.from({ length: 10 }, (_, index) => result("CO", index));
    const shown = resultsForNetwork([...me, ...co], 3);
    expect(shown).toEqual([...me.slice(0, 3), ...co.slice(0, 3)]);
  });

  it("does not refill unused directional capacity", () => {
    const me = [result("ME", 0)];
    const co = Array.from({ length: 10 }, (_, index) => result("CO", index));
    expect(resultsForNetwork([...me, ...co], 3)).toEqual([me[0], ...co.slice(0, 3)]);
  });

  it("defaults to the top ten per direction", () => {
    const me = Array.from({ length: 15 }, (_, index) => result("ME", index));
    const co = Array.from({ length: 15 }, (_, index) => result("CO", index));
    expect(resultsForNetwork([...me, ...co])).toEqual([
      ...me.slice(0, 10),
      ...co.slice(0, 10),
    ]);
  });
});
