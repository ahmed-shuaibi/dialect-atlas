import { describe, expect, it } from "vitest";
import { parseAtlasHash, serializeAtlasHash, URL_DEFAULTS } from "@/lib/useHashState";

describe("Atlas hash state", () => {
  it("starts without an arbitrary cohort", () => {
    expect(parseAtlasHash("")).toEqual(URL_DEFAULTS);
    expect(parseAtlasHash("").cohort).toBeUndefined();
  });

  it("round-trips every addressable view state", () => {
    const state = {
      view: "compare" as const,
      cohort: "TCGA__LUAD",
      mode: "mutsig" as const,
      pair: "ME::KRAS_M::TP53_N",
      settings: true,
      strict: true,
      compareDirection: "CO" as const,
    };
    expect(parseAtlasHash(serializeAtlasHash(state))).toEqual(state);
  });

  it("coerces invalid enums and does not retain removed keys", () => {
    const parsed = parseAtlasHash("#view=nope&mode=nope&settings=0&compare=nope");
    expect(parsed).toEqual(URL_DEFAULTS);
  });
});
