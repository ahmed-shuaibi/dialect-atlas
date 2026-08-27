import { describe, expect, it } from "vitest";
import { parseAtlasHash, serializeAtlasHash, URL_DEFAULTS } from "@/lib/useHashState";

describe("Atlas hash state", () => {
  it("starts cancer-free in the ranked list view", () => {
    expect(parseAtlasHash("")).toEqual(URL_DEFAULTS);
    expect(parseAtlasHash("").cohort).toBeUndefined();
    expect(parseAtlasHash("")).toMatchObject({
      exploreDisplay: "list",
      qThreshold: 0.01,
      significantOnly: false,
    });
  });

  it("round-trips every addressable view state", () => {
    const state = {
      view: "compare" as const,
      cohort: "TCGA__LUAD",
      mode: "mutsig" as const,
      pair: "ME::KRAS_M::TP53_N",
      settings: true,
      exploreDisplay: "network" as const,
      qThreshold: 0.005 as const,
      significantOnly: true,
    };
    expect(parseAtlasHash(serializeAtlasHash(state))).toEqual(state);
  });

  it("coerces invalid enums and q cutoffs to safe defaults", () => {
    const parsed = parseAtlasHash(
      "#view=nope&mode=nope&settings=0&display=nope&q=0.02&significant=nope",
    );
    expect(parsed).toEqual(URL_DEFAULTS);
  });

  it("omits default filters while preserving non-default q and significance state", () => {
    expect(serializeAtlasHash(URL_DEFAULTS)).toBe("#view=explore&mode=consensus&display=list");
    expect(
      serializeAtlasHash({
        ...URL_DEFAULTS,
        qThreshold: 0.05,
        significantOnly: true,
      }),
    ).toBe("#view=explore&mode=consensus&display=list&q=0.05&significant=1");
  });

  it("ignores removed strict and direction settings in legacy links", () => {
    const parsed = parseAtlasHash(
      "#view=explore&cohort=TCGA__LUAD&mode=consensus&strict=1&direction=CO&compare=ME",
    );
    expect(parsed).toEqual({
      ...URL_DEFAULTS,
      cohort: "TCGA__LUAD",
    });
    const serialized = serializeAtlasHash(parsed);
    expect(serialized).not.toContain("strict");
    expect(serialized).not.toContain("direction");
    expect(serialized).not.toContain("compare");
  });
});
